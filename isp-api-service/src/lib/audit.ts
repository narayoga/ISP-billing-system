import type { Db } from '../db/pool.js'

/**
 * Tulis satu entri ke audit_log. Bisa dipanggil dengan pool atau client transaksi
 * agar audit ikut commit/rollback bersama aksi yang diaudit.
 *
 * Aksi yang wajib diaudit (PRD US-11): login admin, generate tagihan massal,
 * approve/reject pembayaran, isolir manual, buka isolir manual, perubahan paket,
 * kirim ulang magic link.
 */
export async function writeAudit(
  db: Db,
  adminId: number | null,
  action: string,
  entityType: string | null,
  entityId: number | null,
  payload?: unknown,
): Promise<void> {
  await db.query(
    `INSERT INTO audit_log (admin_id, action, entity_type, entity_id, payload)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [adminId, action, entityType, entityId, payload == null ? null : JSON.stringify(payload)],
  )
}
