import { logger } from './logger.js'

const BILLING_BASE = process.env.BILLING_BASE_URL ?? 'http://localhost:8081'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

/**
 * Minta isp-billing-service membuka isolir (enable PPPoE) untuk customer.
 * Best-effort: kegagalan tidak menggagalkan approve pembayaran — billing service
 * memvalidasi sendiri apakah customer memang terisolir (idempoten).
 */
export async function reactivateCustomer(customerId: number): Promise<void> {
  try {
    const res = await fetch(`${BILLING_BASE}/internal/customers/${customerId}/reactivate`, {
      method: 'POST',
      headers: { 'X-Internal-Secret': INTERNAL_SECRET },
    })
    if (!res.ok) {
      logger.warn({ customerId, status: res.status }, 'reactivate call gagal')
    }
  } catch (err) {
    logger.warn({ err, customerId }, 'billing-service tidak terjangkau saat reactivate')
  }
}
