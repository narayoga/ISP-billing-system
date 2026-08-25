import { pool } from '../db/pool.js'
import { HttpError } from '../middleware/error.js'
import { writeAudit } from '../lib/audit.js'

export type PaymentRow = {
  id: number
  invoice_id: number
  proof_path: string
  status: 'pending' | 'approved' | 'rejected'
  uploaded_at: Date
}

/**
 * Catat bukti transfer untuk sebuah invoice milik customer ini, lalu set invoice
 * → awaiting_verification (US-02 AC4). Transaksional.
 */
export async function createProof(
  invoiceId: number,
  customerId: number,
  proofPath: string,
): Promise<PaymentRow> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inv = await client.query<{ status: string }>(
      `SELECT status FROM invoices WHERE id = $1 AND customer_id = $2 FOR UPDATE`,
      [invoiceId, customerId],
    )
    if (inv.rowCount === 0) throw new HttpError(404, 'invoice_not_found')
    if (inv.rows[0]!.status === 'paid') throw new HttpError(409, 'invoice_already_paid')

    const ins = await client.query<PaymentRow>(
      `INSERT INTO payments (invoice_id, proof_path, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, invoice_id, proof_path, status, uploaded_at`,
      [invoiceId, proofPath],
    )
    await client.query(
      `UPDATE invoices SET status = 'awaiting_verification', updated_at = NOW() WHERE id = $1`,
      [invoiceId],
    )
    await client.query('COMMIT')
    return ins.rows[0]!
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

// ---------------------------------------------------------------------------
// Sisi admin (verifikasi)
// ---------------------------------------------------------------------------

export type PendingPayment = {
  id: number
  invoice_id: number
  proof_path: string
  status: string
  uploaded_at: Date
  invoice_period: string
  amount: number
  customer_id: number
  customer_name: string
}

export async function listPending(): Promise<PendingPayment[]> {
  const { rows } = await pool.query<PendingPayment>(
    `SELECT p.id, p.invoice_id, p.proof_path, p.status, p.uploaded_at,
            i.period AS invoice_period, i.amount,
            c.id AS customer_id, c.name AS customer_name
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN customers c ON c.id = i.customer_id
     WHERE p.status = 'pending'
     ORDER BY p.uploaded_at ASC`,
  )
  return rows
}

export async function getProofPath(id: number): Promise<string | null> {
  const { rows } = await pool.query<{ proof_path: string }>(
    `SELECT proof_path FROM payments WHERE id = $1`,
    [id],
  )
  return rows[0]?.proof_path ?? null
}

export type ApproveResult = {
  customerId: number
  fullyPaid: boolean
  customerEmail: string | null
  customerPhone: string
  customerName: string
  period: string
  amount: number
}

/** Approve (US-05 AC2): payment→approved, invoice→paid, audit. */
export async function approve(paymentId: number, adminId: number): Promise<ApproveResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const row = await client.query<{
      status: string
      invoice_id: number
      customer_id: number
      email: string | null
      phone: string
      name: string
      period: string
      amount: number
    }>(
      `SELECT p.status, p.invoice_id, i.customer_id, i.period, i.amount,
              c.email, c.phone, c.name
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN customers c ON c.id = i.customer_id
       WHERE p.id = $1 FOR UPDATE`,
      [paymentId],
    )
    if (row.rowCount === 0) throw new HttpError(404, 'payment_not_found')
    const { status, invoice_id, customer_id, email, phone, name, period, amount } = row.rows[0]!
    if (status !== 'pending') throw new HttpError(409, 'already_processed')

    await client.query(
      `UPDATE payments SET status = 'approved', verified_by = $2, verified_at = NOW() WHERE id = $1`,
      [paymentId, adminId],
    )
    await client.query(
      `UPDATE invoices SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [invoice_id],
    )
    await writeAudit(client, adminId, 'approve_payment', 'payment', paymentId, {
      invoice_id,
      customer_id,
    })

    // Pembukaan isolir hanya jika seluruh invoice unpaid/overdue/awaiting sudah beres (PRD §6).
    const remaining = await client.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM invoices
       WHERE customer_id = $1 AND status IN ('unpaid','overdue','awaiting_verification')`,
      [customer_id],
    )
    const fullyPaid = Number(remaining.rows[0]!.n) === 0

    // Tunggakan lunas → pelanggan 'Menunggak' kembali 'Aktif' (PRD §6).
    // Status 'isolated' ditangani billing-service setelah PPPoE benar-benar enable.
    if (fullyPaid) {
      await client.query(
        `UPDATE customers SET status = 'active', updated_at = NOW()
         WHERE id = $1 AND status = 'overdue'`,
        [customer_id],
      )
    }

    await client.query('COMMIT')
    return {
      customerId: customer_id,
      fullyPaid,
      customerEmail: email,
      customerPhone: phone,
      customerName: name,
      period,
      amount,
    }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

export type RejectResult = { invoiceId: number; customerEmail: string | null; customerPhone: string }

/** Reject (US-05 AC3): payment→rejected, invoice→unpaid, audit. */
export async function reject(
  paymentId: number,
  adminId: number,
  reason: string,
): Promise<RejectResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const row = await client.query<{ status: string; invoice_id: number; email: string | null; phone: string }>(
      `SELECT p.status, p.invoice_id, c.email, c.phone
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN customers c ON c.id = i.customer_id
       WHERE p.id = $1 FOR UPDATE`,
      [paymentId],
    )
    if (row.rowCount === 0) throw new HttpError(404, 'payment_not_found')
    const { status, invoice_id, email, phone } = row.rows[0]!
    if (status !== 'pending') throw new HttpError(409, 'already_processed')

    await client.query(
      `UPDATE payments SET status = 'rejected', verified_by = $2, verified_at = NOW(), reject_reason = $3 WHERE id = $1`,
      [paymentId, adminId, reason],
    )
    await client.query(
      `UPDATE invoices SET status = 'unpaid', updated_at = NOW() WHERE id = $1`,
      [invoice_id],
    )
    await writeAudit(client, adminId, 'reject_payment', 'payment', paymentId, {
      invoice_id,
      reason,
    })
    await client.query('COMMIT')
    return { invoiceId: invoice_id, customerEmail: email, customerPhone: phone }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}
