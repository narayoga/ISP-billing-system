import type { CoverageArea } from './types'

// TODO(konten): status sementara — ganti dengan daftar area dari tim teknis JITU.
const ubud = (id: string, village: string, status: CoverageArea['status']): CoverageArea => ({
  id,
  province: 'Bali',
  city: 'Kabupaten Gianyar',
  district: 'Ubud',
  village,
  status,
})

export const coverage: CoverageArea[] = [
  ubud('ubud-ubud', 'Ubud', 'tersedia'),
  ubud('ubud-peliatan', 'Peliatan', 'tersedia'),
  ubud('ubud-petulu', 'Petulu', 'tersedia'),
  ubud('ubud-lodtunduh', 'Lodtunduh', 'tersedia'),
  ubud('ubud-mas', 'Mas', 'tersedia'),
  ubud('ubud-kedewatan', 'Kedewatan', 'segera'),
  ubud('ubud-sayan', 'Sayan', 'segera'),
  ubud('ubud-singakerta', 'Singakerta', 'segera'),
]
