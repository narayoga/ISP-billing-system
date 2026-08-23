import { pool } from '../db/pool.js'

export type AuditEntry = {
  id: number
  admin_id: number | null
  admin_email: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  payload: unknown
  created_at: Date
}

export async function listAudit(limit = 200): Promise<AuditEntry[]> {
  const { rows } = await pool.query<AuditEntry>(
    `SELECT a.id, a.admin_id, u.email AS admin_email, a.action,
            a.entity_type, a.entity_id, a.payload, a.created_at
     FROM audit_log a
     LEFT JOIN admin_users u ON u.id = a.admin_id
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $1`,
    [limit],
  )
  return rows
}
