import { Button } from '../components/Button'
import type { HeaderHandle } from '../components/layout/Header'
import { pageMeta } from '../lib/seo'
import { waLink } from '../lib/whatsapp'
import './not-found.css'

export const handle: HeaderHandle = { header: 'solid' }

export function meta() {
  return pageMeta({ title: 'Halaman tidak ditemukan', path: '/404', noindex: true })
}

// URL yang tidak dikenal. Status HTTP 404 di Cloudflare diatur di Fase 8.
export default function NotFound() {
  return (
    <section className="not-found">
      <div className="container not-found__inner">
        <p className="not-found__code">404</p>
        <h1>Halaman tidak ditemukan</h1>
        <p>Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p>
        <div className="not-found__actions">
          <Button href="/">Kembali ke Beranda</Button>
          <Button variant="secondary" icon="whatsapp" href={waLink('WEB-WIDGET')}>
            Tanya via WhatsApp
          </Button>
        </div>
      </div>
    </section>
  )
}
