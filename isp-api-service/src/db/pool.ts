import pg from 'pg'
import { logger } from '../lib/logger.js'

// DATE (OID 1082) dikembalikan apa adanya sebagai 'YYYY-MM-DD' (hindari konversi
// ke Date lokal yang bisa menggeser tanggal saat di-serialize ke UTC).
pg.types.setTypeParser(1082, (v: string) => v)

// BIGINT (OID 20) → number JS. Default node-postgres mengembalikannya sebagai
// string; ini bikin id/amount jadi string (tak sesuai OpenAPI) dan JWT `sub`
// bertipe string sehingga verifikasi di isp-billing-service (Go int64) gagal.
// Nilai id/amount MVP aman di rentang Number.MAX_SAFE_INTEGER.
pg.types.setTypeParser(20, (v: string) => parseInt(v, 10))

const url = process.env.DATABASE_URL
if (!url) {
  logger.error('DATABASE_URL belum di-set')
  process.exit(1)
}

export const pool = new pg.Pool({
  connectionString: url,
  max: 10,
  idleTimeoutMillis: 30_000,
})

/** Bisa berupa pool langsung atau client transaksi (pool.connect()). */
export type Db = pg.Pool | pg.PoolClient

pool.on('error', (err) => {
  logger.error({ err }, 'pg pool error')
})

export async function pingDB(): Promise<void> {
  await pool.query('SELECT 1')
}
