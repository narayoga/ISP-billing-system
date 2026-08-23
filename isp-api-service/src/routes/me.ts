import fs from 'node:fs'
import { Router } from 'express'
import { authRequired, requireCustomer } from '../middleware/auth.js'
import { HttpError } from '../middleware/error.js'
import { uploadProof } from '../lib/uploads.js'
import * as me from '../services/me.js'
import * as payments from '../services/payments.js'

export const meRouter = Router()

meRouter.use(authRequired, requireCustomer)

meRouter.get('/profile', async (req, res, next) => {
  try {
    const profile = await me.getProfile(req.auth!.sub)
    if (!profile) throw new HttpError(404, 'not_found')
    res.json(profile)
  } catch (e) {
    next(e)
  }
})

meRouter.get('/invoices', async (req, res, next) => {
  try {
    res.json(await me.listInvoices(req.auth!.sub))
  } catch (e) {
    next(e)
  }
})

// Upload bukti transfer (multipart, field 'proof').
meRouter.post('/invoices/:id/proof', uploadProof, async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id)
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) throw new HttpError(400, 'invalid_id')
    if (!req.file) throw new HttpError(400, 'no_file')
    const payment = await payments.createProof(invoiceId, req.auth!.sub, req.file.filename)
    res.status(201).json(payment)
  } catch (e) {
    // Hapus file orphan bila penyimpanan ke DB gagal.
    if (req.file) fs.promises.unlink(req.file.path).catch(() => {})
    next(e)
  }
})
