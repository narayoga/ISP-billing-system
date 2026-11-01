import { site } from '../content/site'

/**
 * Kode sumber pada pesan WhatsApp otomatis, agar CS bisa menghitung prospek
 * yang datang dari situs (PRD US-03 AC 2).
 */
export type WaSource =
  | 'WEB-WIDGET'
  | 'WEB-HERO'
  | 'WEB-PAKET'
  | 'WEB-COVERAGE'
  | 'WEB-DAFTAR'
  | 'WEB-TAGIHAN'
  | 'WEB-KONTAK'

/**
 * Tautan wa.me berisi pesan awal + kode sumber. Jangan pernah menyisipkan data
 * pribadi dari form ke pesan (PRD §6 Prinsip Umum).
 */
export function waLink(source: WaSource, message = 'Halo JITU, saya ingin bertanya tentang layanan internet.', number = site.contact.whatsappSales): string {
  const text = `${message} [${source}]`
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

export function telLink(number = site.contact.phone): string {
  return `tel:+${number}`
}
