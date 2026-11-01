import { coverage } from '../content/coverage'
import type { CoverageArea } from '../content/types'

// Pencarian coverage sepenuhnya di browser dari content/coverage.ts — tanpa
// request jaringan (PRD US-06 AC 4). Dipakai halaman /coverage dan widget Beranda.

/** Hasil yang bisa dipilih: satu desa, atau seluruh desa di satu kecamatan/kota. */
export type CoverageMatch =
  | { kind: 'area'; area: CoverageArea }
  | { kind: 'group'; level: 'kecamatan' | 'kota'; name: string; areas: CoverageArea[] }

export const MAX_SUGGESTIONS = 8 // PRD US-06 AC 1

const PREFIXES = /^(desa|kelurahan|kel\.?|kecamatan|kec\.?|kabupaten|kab\.?|kota)\s+/

/** Tidak peka huruf besar/kecil, aksen, dan spasi berlebih; buang awalan "desa", "kec." dsb. */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // hapus tanda aksen hasil NFD
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(PREFIXES, '')
}

const groupBy = (key: 'district' | 'city') => {
  const map = new Map<string, CoverageArea[]>()
  for (const a of coverage) map.set(a[key], [...(map.get(a[key]) ?? []), a])
  return map
}
const districts = groupBy('district')
const cities = groupBy('city')

/** Skor kecocokan: diawali > mengandung; desa diprioritaskan di atas wilayah. */
function score(name: string, q: string): number {
  const n = normalize(name)
  if (n === q) return 3
  if (n.startsWith(q)) return 2
  if (n.includes(q)) return 1
  return 0
}

type Level = 'desa' | 'kecamatan' | 'kota'

/** Awalan yang diketik pengguna ("kec. ubud", "kab gianyar") jadi petunjuk tingkat wilayah. */
function levelHint(value: string): Level | null {
  const v = value.toLowerCase().trim()
  if (/^(desa|kelurahan|kel\.?)\s/.test(v)) return 'desa'
  if (/^(kecamatan|kec\.?)\s/.test(v)) return 'kecamatan'
  if (/^(kabupaten|kab\.?|kota)\s/.test(v)) return 'kota'
  return null
}

/** Saran saat mengetik (maks. 8): desa, lalu kecamatan, lalu kota — kecuali ada petunjuk awalan. */
export function suggest(query: string): CoverageMatch[] {
  const q = normalize(query)
  if (q.length < 2) return []

  const villages = coverage
    .map((area) => ({ area, s: score(area.village, q) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.area.village.localeCompare(b.area.village))
    .map((r): CoverageMatch => ({ kind: 'area', area: r.area }))

  const groups = (map: Map<string, CoverageArea[]>, level: 'kecamatan' | 'kota') =>
    [...map.entries()]
      .filter(([name]) => score(name, q) > 0)
      .map(([name, areas]): CoverageMatch => ({ kind: 'group', level, name, areas }))

  const byLevel = { desa: villages, kecamatan: groups(districts, 'kecamatan'), kota: groups(cities, 'kota') }
  const hint = levelHint(query)
  const order: Level[] = hint === 'kecamatan' ? ['kecamatan', 'desa', 'kota'] : hint === 'kota' ? ['kota', 'kecamatan', 'desa'] : ['desa', 'kecamatan', 'kota']
  return order.flatMap((l) => byLevel[l]).slice(0, MAX_SUGGESTIONS)
}

/**
 * Hasil saat pengguna menekan Cek tanpa memilih saran: kecocokan terbaik, atau
 * null bila area belum terdaftar (status "Belum Tersedia", PRD US-06 AC 2).
 */
export function resolve(query: string): CoverageMatch | null {
  const q = normalize(query)
  if (!q) return null
  const exact = suggest(query).find((m) =>
    m.kind === 'area' ? normalize(m.area.village) === q : normalize(m.name) === q,
  )
  return exact ?? suggest(query)[0] ?? null
}

export function matchLabel(m: CoverageMatch): string {
  return m.kind === 'area'
    ? `${m.area.village}, Kec. ${m.area.district}`
    : `${m.level === 'kecamatan' ? 'Kecamatan' : ''} ${m.name}`.trim()
}

/** Struktur daftar lengkap: kota → kecamatan → desa (PRD US-06 AC 3). */
export function coverageTree(): { city: string; districts: { name: string; areas: CoverageArea[] }[] }[] {
  return [...cities.entries()].map(([city, areas]) => ({
    city,
    districts: [...new Set(areas.map((a) => a.district))].map((name) => ({
      name,
      areas: areas.filter((a) => a.district === name).sort((a, b) => a.village.localeCompare(b.village)),
    })),
  }))
}
