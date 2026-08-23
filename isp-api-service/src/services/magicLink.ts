import { randomUUID } from 'node:crypto'
import type { Db } from '../db/pool.js'

const TTL_MS = 24 * 60 * 60 * 1000 // 24 jam (PRD US-09 AC2)

/**
 * Invalidasi token magic link lama (yang belum dipakai) milik customer ini,
 * lalu buat token baru sekali-pakai berlaku 24 jam. Dipakai saat membuat
 * customer baru (US-09) dan saat admin kirim ulang (US-10).
 *
 * Jalankan di dalam transaksi (lewat client) agar konsisten dengan aksi pemicunya.
 */
export async function issueMagicLink(
  db: Db,
  customerId: number,
): Promise<{ token: string; expiresAt: Date }> {
  await db.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE customer_id = $1 AND used_at IS NULL`,
    [customerId],
  )
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + TTL_MS)
  await db.query(
    `INSERT INTO password_reset_tokens (token, customer_id, expires_at)
     VALUES ($1, $2, $3)`,
    [token, customerId, expiresAt],
  )
  return { token, expiresAt }
}

export function magicLinkUrl(token: string): string {
  const portalBase = process.env.PORTAL_BASE_URL ?? 'http://localhost:5173'
  return `${portalBase}/portal/set-password?token=${token}`
}
