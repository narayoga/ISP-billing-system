import { logger } from './logger.js'

/**
 * Client WhatsApp lewat gateway Wablas (kanal utama PRD v3.0 US-12).
 *
 * Kontrak API (terverifikasi terhadap smg.wablas.com):
 *   POST {base}/api/send-message
 *   Header : Authorization: {token}.{secret}
 *   Body   : application/x-www-form-urlencoded — phone, message
 *
 * Wablas adalah gateway tidak resmi; pemakaiannya dipisah di file ini agar
 * perpindahan ke WhatsApp Business API resmi tidak menyentuh logika bisnis.
 */
const BASE_URL = (process.env.WABLAS_BASE_URL ?? 'https://smg.wablas.com').replace(/\/+$/, '')
const TOKEN = process.env.WABLAS_TOKEN ?? ''
const SECRET = process.env.WABLAS_SECRET ?? ''

export const whatsappEnabled = TOKEN !== ''

if (whatsappEnabled) {
  logger.info({ base: BASE_URL }, 'WhatsApp (Wablas) aktif')
} else {
  logger.info('WABLAS_TOKEN kosong — notifikasi WhatsApp dilewati')
}

/**
 * Kirim pesan WhatsApp. Best-effort: kegagalan hanya dicatat ke log dan tidak
 * pernah melempar error, agar tidak menggagalkan transaksi bisnis pemicunya
 * (US-12 AC2).
 */
export async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!whatsappEnabled || !phone) return
  try {
    const res = await fetch(`${BASE_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        Authorization: `${TOKEN}.${SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ phone, message }),
    })
    // Wablas selalu membalas HTTP 200; diterima/ditolak ada di field "status".
    //
    // PENTING: status=true hanya berarti pesan MASUK ANTRIAN gateway, bukan sudah
    // sampai ke penerima. Wablas memproses antrian dengan jeda (setelan
    // delay_message pada perangkat), jadi pengiriman nyata tertunda beberapa
    // detik. Jangan perlakukan log ini sebagai bukti pesan diterima pelanggan.
    const body = (await res.json()) as {
      status?: boolean
      message?: string
      data?: { messages?: { id?: string; status?: string }[] }
    }
    if (!body.status) {
      logger.warn({ phone, reason: body.message }, 'WhatsApp ditolak Wablas')
      return
    }
    // id pesan berguna untuk menelusuri status pengiriman di dashboard Wablas.
    const first = body.data?.messages?.[0]
    logger.info(
      { phone, messageId: first?.id, state: first?.status },
      'WhatsApp diterima antrian gateway',
    )
  } catch (err) {
    logger.error({ err, phone }, 'gagal kirim WhatsApp')
  }
}
