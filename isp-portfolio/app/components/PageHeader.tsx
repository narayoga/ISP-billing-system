import { useEffect, useRef, type RefObject } from 'react'
import { Link } from 'react-router'
import './PageHeader.css'

type Props = {
  title: string
  description?: string
  /** Label remah roti terakhir bila berbeda dari judul; null = tanpa remah roti */
  crumb?: string | null
}

/** Jumlah garis "bintang jatuh" (pola .lines Jagonet) */
const LINES = 5

/**
 * Pita judul halaman dalam (padanan "page title area" Jagonet). Latar gelap
 * agar header transparan berlogo putih terbaca; teks masuk berurutan seperti
 * teks hero CMS-portfolio (animasi CSS, tidak menunggu JavaScript).
 *
 * Hiasan: garis tipis vertikal dengan kilatan putih yang jatuh (dari Jagonet),
 * dan efek tirai — tepi bawah lurus saat diam, lalu melengkung naik dari tengah
 * mengikuti scroll, sementara teks naik lebih lambat dan memudar.
 */
export function PageHeader({ title, description, crumb = title }: Props) {
  const ref = useRef<HTMLElement>(null)
  useCurtain(ref)

  return (
    <section ref={ref} className="page-header">
      <div className="page-header__lines" aria-hidden="true">
        {Array.from({ length: LINES }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="container page-header__inner">
        {crumb !== null && (
          <nav aria-label="Remah roti" className="page-header__crumbs">
            <ol>
              <li>
                <Link to="/">Beranda</Link>
              </li>
              <li aria-current="page">{crumb}</li>
            </ol>
          </nav>
        )}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__desc">{description}</p>}
      </div>
      {/* Lengkungan tirai: kubah selebar header, puncak di tengah; tingginya = --curtain-depth.
          Garis aksen opsional ikut melengkung di tepinya (lihat accentOf). */}
      <svg className="page-header__curtain" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="page-header-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
            <stop offset="0" className="page-header__edge-from" />
            <stop offset="1" className="page-header__edge-to" />
          </linearGradient>
        </defs>
        <path d="M0 100 C20 -33.33 80 -33.33 100 100 Z" />
      </svg>
    </section>
  )
}

/**
 * Efek tirai: kemajuan scroll melewati tinggi header (0 → 1) diterjemahkan ke
 * kedalaman lengkungan dan geser/pudar teks lewat CSS variable. Lenis menggulir
 * window per frame, jadi event scroll biasa sudah sinkron dengan smooth scroll.
 */
function useCurtain(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Warna tirai = warna teratas section berikutnya, agar lengkungan menyatu dengan konten di bawahnya.
    const next = el.nextElementSibling
    el.style.setProperty('--curtain-fill', topColorOf(next))
    // Garis aksen di tepi atas section berikutnya (mis. /layanan) diambil alih tirai
    // agar ikut melengkung, bukan tertinggal lurus di bawah kubah.
    const edge = accentOf(next)
    if (edge) {
      el.classList.add('has-curtain-edge')
      el.style.setProperty('--curtain-edge-from', edge[0])
      el.style.setProperty('--curtain-edge-to', edge[1])
    }

    let frame = 0
    const update = () => {
      frame = 0
      const height = el.offsetHeight
      const scrolled = Math.min(Math.max(window.scrollY, 0), height)
      const progress = scrolled / height
      const eased = 1 - (1 - progress) ** 2 // cepat di awal, melambat di akhir
      el.style.setProperty('--curtain-depth', `${(eased * height * 0.55).toFixed(1)}px`)
      el.style.setProperty('--curtain-shift', `${(scrolled * 0.35).toFixed(1)}px`)
      el.style.setProperty('--curtain-progress', progress.toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      el.classList.remove('has-curtain-edge')
    }
  }, [ref])
}

const rgba = (s: string) => s.match(/[\d.]+/g)?.map(Number) ?? []

/**
 * Warna di tepi atas sebuah elemen: warna latar padat, atau warna henti pertama
 * gradien latarnya (mis. .product-section di /layanan), dipadukan di atas latar
 * halaman bila transparan sebagian.
 */
function topColorOf(next: Element | null): string {
  const pageBg = getComputedStyle(document.body).backgroundColor
  if (!next) return pageBg
  const style = getComputedStyle(next)
  const solid = rgba(style.backgroundColor)
  const stop = style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0]
  const color = solid.length === 4 && solid[3] === 0 ? (stop ? rgba(stop) : solid) : solid
  const [r, g, b, a = 1] = color
  if (a >= 1) return `rgb(${r}, ${g}, ${b})`
  const [br, bg, bb] = rgba(pageBg)
  const mix = (c: number, base: number) => Math.round(c * a + base * (1 - a))
  return `rgb(${mix(r, br)}, ${mix(g, bg)}, ${mix(b, bb)})`
}

/** Warna awal & akhir garis aksen tipis bergradien (::before setinggi ≤ 8px di tepi atas), bila ada. */
function accentOf(next: Element | null): [string, string] | null {
  if (!next) return null
  const line = getComputedStyle(next, '::before')
  if (line.content === 'none' || parseFloat(line.height) > 8 || parseFloat(line.top) !== 0) return null
  const stops = line.backgroundImage.match(/rgba?\([^)]+\)/g)
  return stops && stops.length >= 2 ? [stops[0], stops[stops.length - 1]] : null
}
