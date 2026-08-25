import { sendNotification } from './mailer.js'
import { sendWhatsApp } from './whatsapp.js'

export type Recipient = {
  /** Nomor WhatsApp format internasional — kanal utama. */
  phone?: string | null
  /** Email — kanal pendamping, opsional sejak PRD v3.0. */
  email?: string | null
}

/**
 * Kirim notifikasi ke seluruh kanal yang tersedia (PRD v3.0 US-12).
 *
 * Kanal yang kosong dilewati, dan kegagalan satu kanal tidak menggagalkan
 * kanal lain maupun proses bisnis pemicunya — keduanya best-effort.
 */
export async function notifyCustomer(
  to: Recipient,
  subject: string,
  body: string,
): Promise<void> {
  await Promise.allSettled([
    to.phone ? sendWhatsApp(to.phone, body) : Promise.resolve(),
    to.email ? sendNotification(to.email, subject, body) : Promise.resolve(),
  ])
}
