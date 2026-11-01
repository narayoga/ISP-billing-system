import { useEffect, useRef, type ReactNode } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import './MapView.css'

export type MapMarker = {
  lat: number
  lng: number
  label: string
  /** Isi popup (HTML sederhana); default = label tebal */
  popup?: string
  /** brand = pin kantor; tersedia/segera = titik ODP area layanan */
  variant?: 'brand' | 'tersedia' | 'segera'
}

type Props = {
  markers: MapMarker[]
  /** Nama peta untuk pembaca layar */
  label: string
  /** Zoom bila hanya satu titik; banyak titik → peta otomatis membingkai semuanya */
  zoom?: number
  /** Legenda yang ditumpuk di pojok kiri bawah peta */
  legend?: ReactNode
  className?: string
}

/**
 * Peta OpenStreetMap via Leaflet — gratis, tanpa API key.
 *
 * Leaflet (±40 KB) beserta CSS-nya baru diunduh saat peta mendekati layar,
 * jadi tidak membebani halaman lain maupun muatan awal. Roda mouse tidak
 * memperbesar peta (agar scroll halaman tidak "tersangkut"); di ponsel peta
 * tidak bisa digeser satu jari supaya halaman tetap mudah di-scroll — gunakan
 * tombol +/− atau cubit untuk zoom.
 */
export function MapView({ markers, label, zoom = 15, legend, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const hasLegend = Boolean(legend)

  useEffect(() => {
    const el = ref.current
    if (!el || markers.length === 0) return
    let map: LeafletMap | undefined
    let cancelled = false

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        if (cancelled) return

        map = L.map(el, { scrollWheelZoom: false, dragging: !L.Browser.mobile })
        map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>')
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        }).addTo(map)

        for (const m of markers) {
          const variant = m.variant ?? 'brand'
          // Penanda dari CSS (warna brand / status) — tanpa gambar marker bawaan Leaflet.
          const icon =
            variant === 'brand'
              ? L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [40, 40], iconAnchor: [20, 40] })
              : L.divIcon({ className: `map-odp map-odp--${variant}`, html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] })
          L.marker([m.lat, m.lng], { icon, title: m.label, alt: m.label })
            .addTo(map)
            .bindPopup(m.popup ?? `<strong>${m.label}</strong>`)
        }

        if (markers.length === 1) map.setView([markers[0].lat, markers[0].lng], zoom)
        // Ruang bawah ekstra bila ada legenda, agar titik tidak tertutup kotaknya.
        else
          map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), {
            paddingTopLeft: [36, 36],
            paddingBottomRight: [36, hasLegend ? 96 : 36],
          })
      },
      { rootMargin: '300px' },
    )
    io.observe(el)

    return () => {
      cancelled = true
      io.disconnect()
      map?.remove()
    }
  }, [markers, zoom, hasLegend])

  return (
    <div className={['map-view', className].filter(Boolean).join(' ')}>
      <div ref={ref} className="map-view__canvas" role="region" aria-label={label} data-lenis-prevent />
      {legend && <div className="map-view__legend">{legend}</div>}
    </div>
  )
}
