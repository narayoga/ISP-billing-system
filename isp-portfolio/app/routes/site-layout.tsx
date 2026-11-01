import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { FloatingContact } from '../components/layout/FloatingContact'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import './site-layout.css'

/**
 * Kerangka semua halaman publik: header, konten, footer, widget melayang.
 *
 * Transisi antar halaman meniru CMS-portfolio (PublicLayout.jsx): konten
 * di-mount ulang per pathname lalu isinya fade-up 0,35 detik (latar tetap diam,
 * lihat site-layout.css). Muatan pertama tidak
 * dianimasikan agar HTML prerender langsung tampil (dan hidrasi cocok); animasi
 * aktif sejak navigasi pertama, termasuk saat tombol Kembali.
 * Scroll ke atas/ke #anchor saat pindah halaman ditangani <ScrollRestoration>.
 */
export default function SiteLayout() {
  const location = useLocation()
  const [firstKey] = useState(location.key)
  const [animate, setAnimate] = useState(false)
  if (!animate && location.key !== firstKey) setAnimate(true)

  return (
    <>
      <a href="#konten" className="skip-link">
        Lewati ke konten
      </a>
      <Header />
      <main id="konten" tabIndex={-1}>
        <div key={location.pathname} className={animate ? 'route-fade' : undefined}>
          <Outlet />
        </div>
      </main>
      <Footer />
      <FloatingContact />
    </>
  )
}
