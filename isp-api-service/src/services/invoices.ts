import { pool } from '../db/pool.js'

export type Invoice = {
  id: number
  customer_id: number
  period: string
  amount: number
  due_date: string
  status: 'unpaid' | 'awaiting_verification' | 'paid' | 'overdue'
  created_at: Date
  customer_name?: string | null
}

const COLS = `i.id, i.customer_id, i.period, i.amount, i.due_date, i.status, i.created_at,
              c.name AS customer_name`

export async function listInvoices(filters: {
  status?: string
  customerId?: number
}): Promise<Invoice[]> {
  const conds: string[] = []
  const params: unknown[] = []
  if (filters.status) {
    params.push(filters.status)
    conds.push(`i.status = $${params.length}`)
  }
  if (filters.customerId) {
    params.push(filters.customerId)
    conds.push(`i.customer_id = $${params.length}`)
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const { rows } = await pool.query<Invoice>(
    `SELECT ${COLS}
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     ${where}
     ORDER BY i.created_at DESC, i.id DESC`,
    params,
  )
  return rows
}

export async function getInvoice(id: number): Promise<Invoice | null> {
  const { rows } = await pool.query<Invoice>(
    `SELECT ${COLS}
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.id = $1`,
    [id],
  )
  return rows[0] ?? null
}
