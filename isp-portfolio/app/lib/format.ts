const rupiah = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/** 175500 → "Rp175.500" (format PRD US-05 AC 2). */
export function formatRupiah(n: number): string {
  return `Rp${rupiah.format(n)}`
}

/** "6281234567890" → "0812-3456-7890" untuk ditampilkan. */
export function formatPhone(intl: string): string {
  const local = intl.startsWith('62') ? `0${intl.slice(2)}` : intl
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3')
}
