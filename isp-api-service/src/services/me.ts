import { pool } from '../db/pool.js'

export type Profile = {
  id: number
  name: string
  email: string
  address: string
  status: string
  pppoe_username: string
  package: {
    id: number
    name: string
    speed_mbps: number
    quota_gb: number | null
    fup_mbps: number | null
    price: number
  }
}

type ProfileRow = {
  id: number
  name: string
  email: string
  address: string
  status: string
  pppoe_username: string
  p_id: number
  p_name: string
  speed_mbps: number
  quota_gb: number | null
  fup_mbps: number | null
  price: number
}

export async function getProfile(customerId: number): Promise<Profile | null> {
  const { rows } = await pool.query<ProfileRow>(
    `SELECT c.id, c.name, c.email, c.address, c.status, c.pppoe_username,
            p.id AS p_id, p.name AS p_name, p.speed_mbps, p.quota_gb, p.fup_mbps, p.price
     FROM customers c
     JOIN packages p ON p.id = c.package_id
     WHERE c.id = $1`,
    [customerId],
  )
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    address: r.address,
    status: r.status,
    pppoe_username: r.pppoe_username,
    package: {
      id: r.p_id,
      name: r.p_name,
      speed_mbps: r.speed_mbps,
      quota_gb: r.quota_gb,
      fup_mbps: r.fup_mbps,
      price: r.price,
    },
  }
}

export type MyInvoice = {
  id: number
  customer_id: number
  period: string
  amount: number
  due_date: string
  status: string
  created_at: Date
}

export async function listInvoices(customerId: number): Promise<MyInvoice[]> {
  const { rows } = await pool.query<MyInvoice>(
    `SELECT id, customer_id, period, amount, due_date, status, created_at
     FROM invoices
     WHERE customer_id = $1
     ORDER BY period DESC, id DESC`,
    [customerId],
  )
  return rows
}
