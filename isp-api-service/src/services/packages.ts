import { pool } from '../db/pool.js'

export type Package = {
  id: number
  name: string
  price: number
  speed_mbps: number
  quota_gb: number | null
  fup_mbps: number | null
  is_active: boolean
}

export type PackageInput = {
  name: string
  price: number
  speed_mbps: number
  quota_gb: number | null
  fup_mbps: number | null
  is_active?: boolean
}

const COLS = `id, name, price, speed_mbps, quota_gb, fup_mbps, is_active`

export async function listPackages(includeInactive = false): Promise<Package[]> {
  const { rows } = await pool.query<Package>(
    `SELECT ${COLS} FROM packages
     ${includeInactive ? '' : 'WHERE is_active = TRUE'}
     ORDER BY id`,
  )
  return rows
}

export async function getPackage(id: number): Promise<Package | null> {
  const { rows } = await pool.query<Package>(
    `SELECT ${COLS} FROM packages WHERE id = $1`,
    [id],
  )
  return rows[0] ?? null
}

export async function createPackage(input: PackageInput): Promise<Package> {
  const { rows } = await pool.query<Package>(
    `INSERT INTO packages (name, price, speed_mbps, quota_gb, fup_mbps, is_active)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE))
     RETURNING ${COLS}`,
    [input.name, input.price, input.speed_mbps, input.quota_gb, input.fup_mbps, input.is_active ?? null],
  )
  return rows[0]!
}

export async function updatePackage(id: number, input: PackageInput): Promise<Package | null> {
  const { rows } = await pool.query<Package>(
    `UPDATE packages
     SET name = $2, price = $3, speed_mbps = $4, quota_gb = $5, fup_mbps = $6,
         is_active = COALESCE($7, is_active), updated_at = NOW()
     WHERE id = $1
     RETURNING ${COLS}`,
    [id, input.name, input.price, input.speed_mbps, input.quota_gb, input.fup_mbps, input.is_active ?? null],
  )
  return rows[0] ?? null
}

/** Soft-delete: nonaktifkan paket (paket masih direferensikan invoices/customers). */
export async function deactivatePackage(id: number): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE packages SET is_active = FALSE, updated_at = NOW() WHERE id = $1`,
    [id],
  )
  return (rowCount ?? 0) > 0
}
