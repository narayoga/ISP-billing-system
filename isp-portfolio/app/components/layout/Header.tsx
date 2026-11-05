import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, NavLink, useLocation, useMatches } from 'react-router'
import { mainNav } from '../../content/navigation'
import { site } from '../../content/site'
import { getLenis } from '../../lib/useSmoothScroll'
import { waLink } from '../../lib/whatsapp'
import { Button } from '../Button'
import { Icon } from '../Icon'
import { MegaMenu } from './MegaMenu'
import './Header.css'

/** Route dapat meminta header langsung solid: `export const handle = { header: 'solid' }` */
export type HeaderHandle = { header?: 'solid' }

function subscribeScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true })
  return () => window.removeEventListener('scroll', onChange)
}
const getScrolled = () => window.scrollY > 10
const getScrolledServer = () => false

const megaId = (label: string) => `mega-${label.toLowerCase().replace(/\s+/g, '-')}`

/**
 * Header fixed gaya CMS-portfolio: transparan dengan logo putih di atas hero,
 * berubah putih solid + logo hitam setelah halaman di-scroll atau saat menu
 * terbuka. Mega menu di desktop, panel akordeon di ponsel.
 */
export function Header() {
  const { pathname } = useLocation()
  const matches = useMatches()
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getScrolledServer)

  const [openMega, setOpenMega] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accordion, setAccordion] = useState<string | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const headerRef = useRef<HTMLElement>(null)

  // Tutup semua menu setiap kali route berganti (pola "reset state saat prop berubah").
  const [prevPath, setPrevPath] = useState(pathname)
  if (prevPath !== pathname) {
    setPrevPath(pathname)
    setOpenMega(null)
    setMobileOpen(false)
    setAccordion(null)
  }

  const closeAll = () => {
    setOpenMega(null)
    setMobileOpen(false)
    setAccordion(null)
  }

  // Esc menutup menu; klik di luar header menutup mega menu.
  useEffect(() => {
    if (!openMega && !mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Kembalikan fokus ke pemicu agar tidak tertinggal di panel yang ditutup (inert).
      const trigger = openMega
        ? headerRef.current?.querySelector<HTMLElement>(`[aria-controls="${megaId(openMega)}"]`)
        : headerRef.current?.querySelector<HTMLElement>('[aria-controls="mobile-menu"]')
      closeAll()
      trigger?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenMega(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [openMega, mobileOpen])

  // Tinggi panel mega menu yang terbuka → --mega-h, agar lembar putih header memanjang
  // persis setinggi panel (diukur ulang bila panel berubah ukuran, mis. layar diubah).
  useLayoutEffect(() => {
    const header = headerRef.current
    const panel = openMega ? document.getElementById(megaId(openMega)) : null
    if (!header || !panel) return
    const sync = () => header.style.setProperty('--mega-h', `${panel.offsetHeight}px`)
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(panel)
    return () => ro.disconnect()
  }, [openMega])

  // Kunci scroll halaman selama menu ponsel terbuka.
  useEffect(() => {
    if (!mobileOpen) return
    const lenis = getLenis()
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpenMega(null), 150)
  }
  const cancelClose = () => window.clearTimeout(closeTimer.current)

  const forceSolid = matches.some((m) => (m.handle as HeaderHandle | undefined)?.header === 'solid')
  const transparent = !forceSolid && !scrolled && !openMega && !mobileOpen

  const cls = [
    'site-header',
    transparent ? 'is-transparent' : 'is-solid',
    openMega && 'has-mega-open',
    mobileOpen && 'has-mobile-open',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header ref={headerRef} className={cls} onMouseLeave={scheduleClose}>
      <span className="site-header__sheet" aria-hidden="true" />
      <div className="container site-header__inner">
        <Link to="/" className="site-header__logo" aria-label={`${site.brand.name} — Beranda`} onClick={closeAll}>
          {/* Dua logo ditumpuk lalu di-crossfade, agar pergantian tidak berkedip.
              fetchPriority high: logo termasuk elemen pertama yang tampil (LCP) — tanpa itu
              ia mengantre di belakang skrip. */}
          <img src={site.brand.logo.light} alt="" width={400} height={192} fetchPriority="high" className="site-header__logo-light" />
          <img src={site.brand.logo.dark} alt="" width={400} height={192} fetchPriority="high" className="site-header__logo-dark" />
        </Link>

        <nav className="site-nav" aria-label="Menu utama">
          <ul className="site-nav__list">
            {mainNav.map((item) =>
              item.mega ? (
                <li
                  key={item.label}
                  className={`site-nav__item${openMega === item.label ? ' is-open' : ''}`}
                  onMouseEnter={() => {
                    cancelClose()
                    setOpenMega(item.label)
                  }}
                >
                  <button
                    type="button"
                    // Tandai aktif bila halaman saat ini salah satu tujuan mega menu
                    className={`site-nav__link${item.mega.links.some((l) => l.to.split('#')[0] === pathname) ? ' active' : ''}`}
                    aria-expanded={openMega === item.label}
                    aria-controls={megaId(item.label)}
                    onClick={() => setOpenMega(openMega === item.label ? null : item.label)}
                  >
                    {item.label}
                    <Icon name="chevron-down" size={16} className="site-nav__caret" />
                  </button>
                  <MegaMenu id={megaId(item.label)} data={item.mega} open={openMega === item.label} onNavigate={closeAll} />
                </li>
              ) : (
                <li
                  key={item.label}
                  className="site-nav__item"
                  onMouseEnter={() => {
                    cancelClose()
                    setOpenMega(null)
                  }}
                >
                  <NavLink to={item.to} end={item.to === '/'} className="site-nav__link" onClick={closeAll}>
                    {item.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="site-header__actions">
          <Button href="/daftar" size="sm" className="site-header__cta">
            Daftar
          </Button>
          <button
            type="button"
            className="site-header__toggle"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} size={26} label={mobileOpen ? 'Tutup menu' : 'Buka menu'} />
          </button>
        </div>
      </div>

      {/* Menu ponsel: mega menu menjadi akordeon */}
      <div id="mobile-menu" className={`mobile-menu${mobileOpen ? ' is-open' : ''}`} inert={!mobileOpen} data-lenis-prevent>
        <nav aria-label="Menu utama (ponsel)" className="container">
          <ul className="mobile-menu__list">
            {mainNav.map((item) =>
              item.mega ? (
                <li key={item.label} className={accordion === item.label ? 'is-expanded' : undefined}>
                  <button
                    type="button"
                    className="mobile-menu__link"
                    aria-expanded={accordion === item.label}
                    onClick={() => setAccordion(accordion === item.label ? null : item.label)}
                  >
                    {item.label}
                    <Icon name="chevron-down" size={20} className="mobile-menu__caret" />
                  </button>
                  <div className="mobile-menu__panel">
                    <ul inert={accordion !== item.label}>
                      {item.mega.links.map((link) => (
                        <li key={link.to + link.label}>
                          <Link to={link.to} className="mobile-menu__sublink" onClick={closeAll}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.label}>
                  <NavLink to={item.to} end={item.to === '/'} className="mobile-menu__link" onClick={closeAll}>
                    {item.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
          <div className="mobile-menu__actions">
            <Button href="/daftar">Daftar Berlangganan</Button>
            <Button variant="whatsapp" icon="whatsapp" href={waLink('WEB-WIDGET')}>
              Chat WhatsApp
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
