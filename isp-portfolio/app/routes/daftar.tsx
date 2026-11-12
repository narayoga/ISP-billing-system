import { useSearchParams } from 'react-router'
import { Button } from '../components/Button'
import { PageHeader } from '../components/PageHeader'
import { RegistrationForm } from '../components/RegistrationForm'
import { site } from '../content/site'
import { pageMeta } from '../lib/seo'
import { useHydrated } from '../lib/useHydrated'
import { waLink } from '../lib/whatsapp'
import './daftar.css'

export function meta() {
  return pageMeta({
    title: 'Daftar Berlangganan',
    description: 'Formulir pendaftaran berlangganan internet fiber Balisolusindo di Ubud, Bali.',
    path: '/daftar',
  })
}

const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

// PRD US-07 / §6A. Prefill ?paket= & ?area= serta tanggal registrasi dibaca
// setelah hidrasi (HTML prerender netral); key memasang ulang form dengan nilai itu.
export default function Daftar() {
  const [params] = useSearchParams()
  const hydrated = useHydrated()
  const paket = hydrated ? (params.get('paket') ?? '') : ''
  const area = hydrated ? (params.get('area') ?? '') : ''
  const today = hydrated ? dateFmt.format(new Date()) : ''

  return (
    <>
      <PageHeader title="Daftar Berlangganan" description="Isi data Anda untuk mulai berlangganan internet fiber Balisolusindo." />
      <section className="section daftar-page">
        <div className="container daftar-page__inner">
          {site.forms.daftar === 'preview' ? (
            <RegistrationForm key={`${hydrated}-${paket}-${area}`} initialPackage={paket} initialArea={area} today={today} />
          ) : (
            // Flag `hidden` (US-07 AC 9): formulir tidak ditampilkan, pendaftaran lewat WhatsApp.
            <div className="daftar-page__wa">
              <h2>Daftar lewat WhatsApp</h2>
              <p>Tim kami akan membantu proses pendaftaran Anda.</p>
              <Button variant="whatsapp" icon="whatsapp" href={waLink('WEB-DAFTAR', 'Halo Balisolusindo, saya ingin berlangganan internet.')}>
                Chat WhatsApp
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
