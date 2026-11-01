import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Kontak Kami',
    description: 'Hubungi JITU lewat WhatsApp, telepon, atau email.',
    path: '/kontak',
  })
}

export default function Kontak() {
  return (
    <>
      <PageHeader title="Kontak Kami" description="Tim kami siap membantu lewat WhatsApp, telepon, maupun email." />
      <PagePlaceholder phase="Fase 4" items={['WhatsApp, telepon, email, alamat & Google Maps', 'Jam operasional', 'Form Kirim Pesan']} />
    </>
  )
}
