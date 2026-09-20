import { Router } from 'express'
import { authRequired, requireAdmin, writePin } from '../middleware/auth.js'
import { emailLimiter } from '../middleware/rateLimit.js'
import { HttpError } from '../middleware/error.js'
import { writeAudit } from '../lib/audit.js'
import { notifyCustomer } from '../lib/notify.js'
import { pool } from '../db/pool.js'
import { issueToken, invoiceUrl } from '../services/invoiceTokens.js'
import * as invoices from '../services/invoices.js'

export const invoicesRouter = Router()

invoicesRouter.use(authRequired, requireAdmin, writePin)

invoicesRouter.get('/', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const customerId = req.query.customer_id ? Number(req.query.customer_id) : undefined
    res.json(await invoices.listInvoices({ status, customerId }))
  } catch (e) {
    next(e)
  }
})

invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id')
    const inv = await invoices.getInvoice(id)
    if (!inv) throw new HttpError(404, 'invoice_not_found')
    res.json(inv)
  } catch (e) {
    next(e)
  }
})

/**
 * POST /invoices/:id/resend-link — kirim ulang tautan tagihan (PRD v3.0 US-10).
 * Menggantikan "kirim ulang magic link" dari PRD v2.0.
 *
 * Token yang sudah ada DIPERPANJANG (bukan diganti), sehingga tautan pada pesan
 * lama tetap berfungsi — sesuai keputusan desain PRD v3.0.
 */
invoicesRouter.post('/:id/resend-link', emailLimiter, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id')

    const { rows } = await pool.query<{
      period: string
      amount: number
      due_date: string
      name: string
      email: string | null
      phone: string
    }>(
      `SELECT i.period, i.amount, i.due_date, c.name, c.email, c.phone
       FROM invoices i JOIN customers c ON c.id = i.customer_id
       WHERE i.id = $1`,
      [id],
    )
    const inv = rows[0]
    if (!inv) throw new HttpError(404, 'invoice_not_found')

    const token = await issueToken(id)
    const link = invoiceUrl(token)

    await notifyCustomer(
      { phone: inv.phone, email: inv.email },
      `Tagihan periode ${inv.period}`,
      `Halo ${inv.name}, berikut tautan tagihan periode ${inv.period} sebesar ` +
        `Rp${inv.amount.toLocaleString('id-ID')} (jatuh tempo ${inv.due_date}). ` +
        `Lihat tagihan dan unggah bukti transfer di: ${link}`,
    )
    await writeAudit(pool, req.auth!.sub, 'resend_invoice_link', 'invoice', id, {
      period: inv.period,
      sent_wa: Boolean(inv.phone),
      sent_email: Boolean(inv.email),
    })
    res.json({ ok: true, link })
  } catch (e) {
    next(e)
  }
})
