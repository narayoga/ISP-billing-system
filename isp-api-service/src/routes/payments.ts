import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { z } from 'zod'
import { authRequired, requireAdmin } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'
import { uploadDirAbs } from '../lib/uploads.js'
import { notifyCustomer } from '../lib/notify.js'
import { issueToken, invoiceUrl } from '../services/invoiceTokens.js'
import { reactivateCustomer } from '../lib/billingClient.js'
import * as payments from '../services/payments.js'

export const paymentsRouter = Router()

function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'invalid_id')
  return id
}

paymentsRouter.use(authRequired, requireAdmin)

// Antrian verifikasi: pembayaran berstatus pending.
paymentsRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await payments.listPending())
  } catch (e) {
    next(e)
  }
})

// Serve file bukti (admin viewer). path.basename mencegah path traversal.
paymentsRouter.get('/:id/proof', async (req, res, next) => {
  try {
    const proofPath = await payments.getProofPath(parseId(req.params.id))
    if (!proofPath) throw new HttpError(404, 'not_found')
    const abs = path.join(uploadDirAbs, path.basename(proofPath))
    if (!fs.existsSync(abs)) throw new HttpError(404, 'file_not_found')
    const ext = path.extname(abs).toLowerCase()
    const type =
      ext === '.pdf' ? 'application/pdf' : ext === '.png' ? 'image/png' : 'image/jpeg'
    res.type(type)
    fs.createReadStream(abs).pipe(res)
  } catch (e) {
    next(e)
  }
})

paymentsRouter.post('/:id/approve', async (req, res, next) => {
  try {
    const result = await payments.approve(parseId(req.params.id), req.auth!.sub)
    // Buka isolir bila seluruh tunggakan sudah lunas (best-effort ke billing-service).
    if (result.fullyPaid) {
      void reactivateCustomer(result.customerId)
    }
    // Notifikasi pembayaran disetujui via WhatsApp + email (PRD v3.0 §8).
    await notifyCustomer(
      { phone: result.customerPhone, email: result.customerEmail },
      'Pembayaran Anda telah disetujui',
      `Halo ${result.customerName}, pembayaran tagihan periode ${result.period} sebesar ` +
        `Rp${result.amount.toLocaleString('id-ID')} telah kami verifikasi. Tagihan berstatus LUNAS.` +
        (result.fullyPaid ? ' Layanan Anda aktif kembali.' : ''),
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

const rejectSchema = z.object({ reason: z.string().min(1).max(500) })

paymentsRouter.post('/:id/reject', async (req, res, next) => {
  try {
    const { reason } = rejectSchema.parse(req.body)
    const paymentId = parseId(req.params.id)
    const { invoiceId, customerEmail, customerPhone } = await payments.reject(
      paymentId,
      req.auth!.sub,
      reason,
    )
    // Sertakan tautan agar pelanggan bisa langsung unggah ulang (US-05 AC3).
    const link = invoiceUrl(await issueToken(invoiceId))
    await notifyCustomer(
      { phone: customerPhone, email: customerEmail },
      'Bukti pembayaran ditolak',
      `Bukti pembayaran Anda ditolak: ${reason}. Mohon unggah ulang bukti yang valid di: ${link}`,
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
