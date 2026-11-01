import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { Section } from '../components/Section'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Tentang Kami',
    description: 'Profil JITU — Jagonya Internet Ubud, layanan internet Jagonet di Ubud, Bali.',
    path: '/tentang',
  })
}

export default function Tentang() {
  return (
    <>
      <PageHeader title="Tentang Kami" description="Mengenal JITU — Jagonya Internet Ubud." />
      <PagePlaceholder phase="Fase 4" items={['Profil perusahaan', 'Galeri (opsional)']} />
      {/* Anchor dari mega menu "Tentang Kami" */}
      <Section id="visi-misi" surface eyebrow="Fase 4" title="Visi & Misi" />
      <Section id="cabang" eyebrow="Fase 4" title="Cabang & POP" />
    </>
  )
}
