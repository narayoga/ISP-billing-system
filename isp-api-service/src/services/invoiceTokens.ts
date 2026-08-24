import { pool } from '../db/pool.js'

// Masa berlaku tautan tagihan (PRD v3.0 US-09 AC3). Harus sama dengan
// TokenTTLDays di isp-billing-service.
const TOKEN_TTL_DAYS = 90

export type TokenStatus = 'valid' | 'not_found' | 'expired' | 'revoked'

export type ResolvedToken = {
  status: TokenStatus
  invoiceId?: number
  customerId?: number
}

/**
 * Validasi token akses publik. Tidak melempar error untuk token tidak valid —
 * pemanggil yang memutuskan respons HTTP-nya.
 */
export async function resolveToken(token: string): Promise<ResolvedToken> {
  const { rows } = await pool.query<{
    invoice_id: number
    customer_id: number
    expired: boolean
    revoked: boolean
  }>(
    `SELECT t.invoice_id,
            i.customer_id,
            (t.expires_at <= NOW()) AS expired,
            (t.revoked_at IS NOT NULL) AS revoked
     FROM invoice_access_tokens t
     JOIN invoices i ON i.id = t.invoice_id
     WHERE t.token = $1`,
    [token],
  )
  const row = rows[0]
  if (!row) return { status: 'not_found' }
  if (row.revoked) return { status: 'revoked' }
  if (row.expired) return { status: 'expired' }
  return { status: 'valid', invoiceId: row.invoice_id, customerId: row.customer_id }
}

/**
 * Terbitkan atau perpanjang token untuk sebuah invoice.
 *
 * Satu invoice = satu token seumur hidupnya: bila sudah ada, masa berlakunya
 * diperpanjang dan status cabut dibatalkan, sehingga tautan yang sudah terkirim
 * di pesan lama tetap berfungsi. Idempoten — logika identik dengan
 * billing.IssueToken di isp-billing-service.
 */
export async function issueToken(invoiceId: number): Promise<string> {
  const { rows } = await pool.query<{ token: string }>(
    `INSERT INTO invoice_access_tokens (token, invoice_id, expires_at)
     VALUES (gen_random_uuid(), $1, NOW() + ($2 * INTERVAL '1 day'))
     ON CONFLICT (invoice_id) DO UPDATE
     SET expires_at = EXCLUDED.expires_at,
         revoked_at = NULL,
         updated_at = NOW()
     RETURNING token::text AS token`,
    [invoiceId, TOKEN_TTL_DAYS],
  )
  return rows[0]!.token
}

export function invoiceUrl(token: string): string {
  const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173'
  return `${base.replace(/\/+$/, '')}/tagihan/${token}`
}

export type PublicInvoiceView = {
  invoice: {
    id: number
    period: string
    amount: number
    due_date: string
    status: string
  }
  customer: { name: string }
  package: {
    name: string
    speed_mbps: number
    quota_gb: number | null
    fup_mbps: number | null
  }
  history: { period: string; amount: number; status: string }[]
}

/**
 * Data untuk halaman tagihan publik.
 *
 * Sengaja minimalis: halaman ini dapat dibuka siapa pun yang memegang tautan,
 * jadi hanya nama pelanggan yang ditampilkan sebagai penanda identitas —
 * alamat, email, dan nomor telepon TIDAK disertakan.
 */
export async function getPublicInvoice(invoiceId: number): Promise<PublicInvoiceView | null> {
  const { rows } = await pool.query<{
    id: number
    period: string
    amount: number
    due_date: string
    status: string
    customer_id: number
    customer_name: string
    package_name: string
    speed_mbps: number
    quota_gb: number | null
    fup_mbps: number | null
  }>(
    `SELECT i.id, i.period, i.amount, i.due_date, i.status,
            c.id AS customer_id, c.name AS customer_name,
            p.name AS package_name, p.speed_mbps, p.quota_gb, p.fup_mbps
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN packages p  ON p.id = c.package_id
     WHERE i.id = $1`,
    [invoiceId],
  )
  const r = rows[0]
  if (!r) return null

  // Riwayat 3 periode sebelumnya (US-01 AC2).
  const hist = await pool.query<{ period: string; amount: number; status: string }>(
    `SELECT period, amount, status
     FROM invoices
     WHERE customer_id = $1 AND id <> $2
     ORDER BY period DESC
     LIMIT 3`,
    [r.customer_id, invoiceId],
  )

  return {
    invoice: {
      id: r.id,
      period: r.period,
      amount: r.amount,
      due_date: r.due_date,
      status: r.status,
    },
    customer: { name: r.customer_name },
    package: {
      name: r.package_name,
      speed_mbps: r.speed_mbps,
      quota_gb: r.quota_gb,
      fup_mbps: r.fup_mbps,
    },
    history: hist.rows,
  }
}
