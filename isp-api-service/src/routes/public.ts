import fs from 'node:fs'
import { Router } from 'express'
import { invoiceTokenRequired } from '../middleware/invoiceToken.js'
import { publicLimiter, uploadLimiter } from '../middleware/rateLimit.js'
import { HttpError } from '../middleware/error.js'
import { uploadProof } from '../lib/uploads.js'
import { getPublicInvoice } from '../services/invoiceTokens.js'
import * as payments from '../services/payments.js'

/**
 * Endpoint publik untuk pelanggan — TANPA autentikasi user (PRD v3.0 US-09).
 * Akses ditentukan oleh kepemilikan token pada path.
 *
 * Karena terbuka untuk umum, seluruh rute di sini wajib dibatasi rate limit.
 */
export const publicRouter = Router()

// GET /public/invoice/:token — detail tagihan + info layanan + riwayat.
publicRouter.get('/invoice/:token', publicLimiter, invoiceTokenRequired, async (req, res, next) => {
  try {
    const view = await getPublicInvoice(req.invoiceAccess!.invoiceId)
    if (!view) throw new HttpError(404, 'invoice_not_found')
    res.json(view)
  } catch (e) {
    next(e)
  }
})

// POST /public/invoice/:token/proof — unggah bukti transfer (US-02).
publicRouter.post(
  '/invoice/:token/proof',
  uploadLimiter,
  invoiceTokenRequired,
  uploadProof,
  async (req, res, next) => {
    try {
      if (!req.file) throw new HttpError(400, 'no_file')
      const { invoiceId, customerId } = req.invoiceAccess!
      const payment = await payments.createProof(invoiceId, customerId, req.file.filename)
      res.status(201).json(payment)
    } catch (e) {
      // Hapus file orphan bila pencatatan ke DB gagal.
      if (req.file) fs.promises.unlink(req.file.path).catch(() => {})
      next(e)
    }
  },
)
