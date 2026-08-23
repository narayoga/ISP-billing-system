import { Router } from 'express'
import { pool } from '../db/pool.js'
import { authRequired, requireAdmin } from '../middleware/auth.js'

export const statsRouter = Router()

// Ringkasan untuk dashboard admin.
statsRouter.get('/', authRequired, requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query<{
      active_customers: number
      isolated_customers: number
      unpaid_invoices: number
      pending_payments: number
    }>(
      `SELECT
         (SELECT COUNT(*) FROM customers WHERE status = 'active')::int            AS active_customers,
         (SELECT COUNT(*) FROM customers WHERE status = 'isolated')::int          AS isolated_customers,
         (SELECT COUNT(*) FROM invoices  WHERE status IN ('unpaid','overdue'))::int AS unpaid_invoices,
         (SELECT COUNT(*) FROM payments  WHERE status = 'pending')::int           AS pending_payments`,
    )
    res.json(rows[0])
  } catch (e) {
    next(e)
  }
})
