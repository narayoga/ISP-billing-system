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

export const email: Validator = (v) => (isEmail(v) ? null : 'Format email tidak valid.')

export const phone: Validator = (v) =>
  isIndonesianPhone(v) ? null : 'Nomor HP harus 10–15 digit, diawali 08 atau 62.'

const digitsOnly = (v: string) => v.replace(/[\s.-]/g, '')

/** KTP: tepat 16 digit; SIM: 12–16 digit (PRD §6A no. 10). */
export const identityNumber =
  (kind: string): Validator =>
  (v) => {
    const d = digitsOnly(v)
    if (!/^\d+$/.test(d)) return 'Nomor identitas hanya berisi angka.'
    if (kind === 'KTP' && d.length !== 16) return 'NIK KTP harus tepat 16 digit.'
    if (kind === 'SIM' && (d.length < 12 || d.length > 16)) return 'Nomor SIM harus 12–16 digit.'
    return null
  }

/** NPWP opsional: 15 atau 16 digit bila diisi. */
export const npwp: Validator = (v) => {
  if (v.trim() === '') return null
  const d = digitsOnly(v)
  return /^\d{15,16}$/.test(d) ? null : 'NPWP harus 15 atau 16 digit.'
}

export const postalCode: Validator = (v) => (/^\d{5}$/.test(v.trim()) ? null : 'Kode pos harus tepat 5 digit.')

/** Usia minimal (tahun) dari tanggal lahir "YYYY-MM-DD". */
export const minAge =
  (years: number): Validator =>
  (v) => {
    const birth = new Date(`${v}T00:00:00`)
    if (Number.isNaN(birth.getTime())) return 'Tanggal lahir tidak valid.'
    const limit = new Date()
    limit.setFullYear(limit.getFullYear() - years)
    return birth <= limit ? null : `Usia minimal ${years} tahun.`
  }

/** Tautan Google Maps opsional (maps.google.com, google.com/maps, goo.gl/maps, maps.app.goo.gl). */
export const googleMapsUrl: Validator = (v) => {
  if (v.trim() === '') return null
  try {
    const u = new URL(v.trim())
    const ok =
      /(^|\.)google\.[a-z.]+$/.test(u.hostname) && (u.hostname.startsWith('maps.') || u.pathname.startsWith('/maps'))
    const short = u.hostname === 'maps.app.goo.gl' || (u.hostname === 'goo.gl' && u.pathname.startsWith('/maps'))
    return ok || short ? null : 'Masukkan tautan Google Maps yang valid.'
  } catch {
    return 'Masukkan tautan Google Maps yang valid.'
  }
}

export const voucher: Validator = (v) =>
  v.trim() === '' || /^[A-Za-z0-9]{1,20}$/.test(v.trim()) ? null : 'Kode voucher berupa huruf/angka, maks. 20 karakter.'

export const PHOTO_TYPES = ['image/jpeg', 'image/png']
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024

/** Foto JPG/PNG maks. 2 MB (PRD §6A no. 1–2). */
export function photoError(file: File | null, label: string, isRequired: boolean): string | null {
  if (!file) return isRequired ? `${label} wajib diunggah.` : null
  if (!PHOTO_TYPES.includes(file.type)) return `${label} harus berformat JPG atau PNG.`
  if (file.size > PHOTO_MAX_BYTES) return `${label} maksimal 2 MB.`
  return null
}

/** Jalankan validator berurutan; galat pertama yang dikembalikan. */
export function validate(value: string, rules: Validator[]): string | null {
  for (const rule of rules) {
    const err = rule(value)
    if (err) return err
  }
  return null
}
