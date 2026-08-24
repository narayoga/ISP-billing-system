import { pool } from '../db/pool.js'
import { HttpError } from '../middleware/error.js'
import { writeAudit } from '../lib/audit.js'

export type CustomerStatus =
  | 'pending_provisioning'
  | 'active'
  | 'overdue'
  | 'isolated'
  | 'inactive'

export type Customer = {
  id: number
  name: string
  /** Nomor WhatsApp, format internasional (mis. 628123456789) — kanal utama. */
  phone: string
  /** Opsional sejak PRD v3.0: kanal pendamping, bukan identitas login. */
  email: string | null
  address: string
  package_id: number
  pppoe_username: string
  ip_address: string | null
  mac_address: string | null
  status: CustomerStatus
  created_at: Date
}

export type CustomerListItem = Customer & { package_name: string | null }

export type CustomerInput = {
  name: string
  phone: string
  email: string | null
  address: string
  package_id: number
  pppoe_username: string
  ip_address: string | null
  mac_address: string | null
}

const COLS = `id, name, phone, email, address, package_id, pppoe_username,
              ip_address, mac_address, status, created_at`

export async function listCustomers(): Promise<CustomerListItem[]> {
  const { rows } = await pool.query<CustomerListItem>(
    `SELECT c.id, c.name, c.phone, c.email, c.address, c.package_id, c.pppoe_username,
            c.ip_address, c.mac_address, c.status, c.created_at,
            p.name AS package_name
     FROM customers c
     LEFT JOIN packages p ON p.id = c.package_id
     ORDER BY c.id DESC`,
  )
  return rows
}

export async function getCustomer(id: number): Promise<CustomerListItem | null> {
  const { rows } = await pool.query<CustomerListItem>(
    `SELECT c.id, c.name, c.phone, c.email, c.address, c.package_id, c.pppoe_username,
            c.ip_address, c.mac_address, c.status, c.created_at,
            p.name AS package_name
     FROM customers c
     LEFT JOIN packages p ON p.id = c.package_id
     WHERE c.id = $1`,
    [id],
  )
  return rows[0] ?? null
}

/**
 * Buat customer baru (US-08).
 *
 * PRD v3.0: tidak ada onboarding magic link — pelanggan tidak punya akun.
 * Nomor WhatsApp wajib karena menjadi kanal notifikasi utama.
 */
export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const pkg = await client.query(`SELECT id FROM packages WHERE id = $1`, [input.package_id])
    if (pkg.rowCount === 0) throw new HttpError(400, 'package_not_found')

    const { rows } = await client.query<Customer>(
      `INSERT INTO customers (name, phone, email, address, package_id, pppoe_username, ip_address, mac_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${COLS}`,
      [
        input.name,
        input.phone,
        input.email,
        input.address,
        input.package_id,
        input.pppoe_username,
        input.ip_address,
        input.mac_address,
      ],
    )
    const customer = rows[0]!
    await client.query('COMMIT')

    // PRD v3.0: pelanggan tidak punya akun, jadi tidak ada magic link onboarding.
    // Tautan tagihan diterbitkan per invoice dan dikirim saat tagihan terbit
    // (US-09), atau lewat "kirim ulang tautan" oleh admin (US-10).
    return customer
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw mapUniqueViolation(e)
  } finally {
    client.release()
  }
}

/** Update data customer. Bila package_id berubah → catat ke audit_log (US-11 "perubahan paket"). */
export async function updateCustomer(
  id: number,
  input: CustomerInput,
  adminId: number,
): Promise<Customer | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const cur = await client.query<{ package_id: number }>(
      `SELECT package_id FROM customers WHERE id = $1 FOR UPDATE`,
      [id],
    )
    if (cur.rowCount === 0) {
      await client.query('ROLLBACK')
      return null
    }
    const prevPackage = cur.rows[0]!.package_id

    const { rows } = await client.query<Customer>(
      `UPDATE customers
       SET name = $2, phone = $3, email = $4, address = $5, package_id = $6,
           pppoe_username = $7, ip_address = $8, mac_address = $9, updated_at = NOW()
       WHERE id = $1
       RETURNING ${COLS}`,
      [
        id,
        input.name,
        input.phone,
        input.email,
        input.address,
        input.package_id,
        input.pppoe_username,
        input.ip_address,
        input.mac_address,
      ],
    )
    const updated = rows[0]!

    if (prevPackage !== input.package_id) {
      await writeAudit(client, adminId, 'change_package', 'customer', id, {
        from_package_id: prevPackage,
        to_package_id: input.package_id,
      })
    }
    await client.query('COMMIT')
    return updated
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw mapUniqueViolation(e)
  } finally {
    client.release()
  }
}

/** Penonaktifan / pengaktifan manual oleh admin. */
export async function setCustomerStatus(
  id: number,
  status: 'inactive' | 'active',
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE customers SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, status],
  )
  return (rowCount ?? 0) > 0
}

/** Konversi unique violation (23505) Postgres menjadi HttpError yang jelas. */
function mapUniqueViolation(e: unknown): unknown {
  if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === '23505') {
    const constraint = (e as { constraint?: string }).constraint ?? ''
    if (constraint.includes('email')) return new HttpError(409, 'email_taken')
    if (constraint.includes('pppoe')) return new HttpError(409, 'pppoe_taken')
    return new HttpError(409, 'duplicate')
  }
  return e
}
