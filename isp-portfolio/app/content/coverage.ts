import type { CoverageArea } from './types'

// Status & titik ODP sementara — ganti dengan data tim teknis Balisolusindo.
// Koordinat ODP hanya perkiraan posisi desa (kosmetik) untuk peta Area Layanan.
const ubud = (
  id: string,
  village: string,
  status: CoverageArea['status'],
  lat: number,
  lng: number,
): CoverageArea => ({
  id,
  province: 'Bali',
  city: 'Kabupaten Gianyar',
  district: 'Ubud',
  village,
  status,
  odp: { lat, lng },
})

export const coverage: CoverageArea[] = [
  ubud('ubud-ubud', 'Ubud', 'tersedia', -8.5069, 115.2625),
  ubud('ubud-peliatan', 'Peliatan', 'tersedia', -8.5175, 115.2785),
  ubud('ubud-petulu', 'Petulu', 'tersedia', -8.4885, 115.2745),
  ubud('ubud-lodtunduh', 'Lodtunduh', 'tersedia', -8.5365, 115.2585),
  ubud('ubud-mas', 'Mas', 'tersedia', -8.5435, 115.2790),
  ubud('ubud-kedewatan', 'Kedewatan', 'segera', -8.4955, 115.2445),
  ubud('ubud-sayan', 'Sayan', 'segera', -8.5075, 115.2400),
  ubud('ubud-singakerta', 'Singakerta', 'segera', -8.5300, 115.2455),
]
