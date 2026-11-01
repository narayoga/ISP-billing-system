// Validasi form di browser (PRD §6). Mengembalikan pesan galat berbahasa
// Indonesia, atau null bila valid. Form kosmetik tidak mengirim data apa pun.

export type Validator = (value: string) => string | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Nomor HP Indonesia: 10–15 digit, diawali 08 atau 62 (spasi/tanda hubung diabaikan). */
export function isIndonesianPhone(value: string): boolean {
  const digits = value.replace(/[\s-]/g, '')
  return /^(08|62)\d{8,13}$/.test(digits)
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

export const required =
  (label: string): Validator =>
  (v) =>
    v.trim() === '' ? `${label} wajib diisi.` : null

export const length =
  (label: string, min: number, max: number): Validator =>
  (v) => {
    const n = v.trim().length
    if (n < min) return `${label} minimal ${min} karakter.`
    if (n > max) return `${label} maksimal ${max} karakter.`
    return null
  }

export const phoneOrEmail: Validator = (v) =>
  isIndonesianPhone(v) || isEmail(v) ? null : 'Isi nomor WhatsApp (08… / 62…) atau alamat email yang valid.'

/** Jalankan validator berurutan; galat pertama yang dikembalikan. */
export function validate(value: string, rules: Validator[]): string | null {
  for (const rule of rules) {
    const err = rule(value)
    if (err) return err
  }
  return null
}
