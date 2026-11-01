import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import './LocationMap.css'

type Props = {
  lat: number
  lng: number
  label: string
  zoom?: number
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
export function LocationMap({ lat, lng, label, zoom = 15 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let map: LeafletMap | undefined
    let cancelled = false

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
        if (cancelled) return

        map = L.map(el, {
          center: [lat, lng],
          zoom,
          scrollWheelZoom: false,
          dragging: !L.Browser.mobile,
        })
        map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>')
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
        }).addTo(map)

        // Pin dari CSS (warna brand) — tanpa gambar marker bawaan Leaflet.
        const icon = L.divIcon({ className: 'map-pin', html: '<span></span>', iconSize: [40, 40], iconAnchor: [20, 40] })
        L.marker([lat, lng], { icon, title: label, alt: label }).addTo(map).bindPopup(`<strong>${label}</strong>`)
      },
      { rootMargin: '300px' },
    )
    io.observe(el)

    return () => {
      cancelled = true
      io.disconnect()
      map?.remove()
    }
  }, [lat, lng, zoom, label])

  return (
    <div className="location-map">
      <div ref={ref} className="location-map__canvas" role="region" aria-label={`Peta lokasi ${label}`} data-lenis-prevent />
    </div>
  )
}
