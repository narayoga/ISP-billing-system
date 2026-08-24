import type { NextFunction, Request, Response } from 'express'
import { resolveToken } from '../services/invoiceTokens.js'

declare module 'express-serve-static-core' {
  interface Request {
    /** Diisi oleh invoiceTokenRequired: invoice yang boleh diakses tautan ini. */
    invoiceAccess?: { invoiceId: number; customerId: number }
  }
}

/**
 * Menggantikan autentikasi JWT untuk sisi pelanggan (PRD v3.0).
 * Pelanggan tidak punya akun; kepemilikan tautan-lah yang memberi akses,
 * dan setiap token hanya membuka SATU invoice.
 */
export async function invoiceTokenRequired(req: Request, res: Response, next: NextFunction) {
  // Express 5 mengetikkan params sebagai string | string[]; ambil bentuk tunggalnya.
  const raw = req.params.token
  const token = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
  // UUID v4 — tolak lebih awal agar tidak membebani database.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return res.status(404).json({ error: 'token_not_found' })
  }
  try {
    const result = await resolveToken(token)
    switch (result.status) {
      case 'valid':
        req.invoiceAccess = { invoiceId: result.invoiceId!, customerId: result.customerId! }
        return next()
      case 'expired':
        return res.status(410).json({ error: 'token_expired' })
      case 'revoked':
        return res.status(410).json({ error: 'token_revoked' })
      default:
        return res.status(404).json({ error: 'token_not_found' })
    }
  } catch (e) {
    next(e)
  }
}
