import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { Section } from '../components/Section'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Layanan & Paket',
    description: 'Paket internet fiber optic JITU untuk rumah dan bisnis di Ubud — unlimited tanpa FUP.',
    path: '/layanan',
  })
}

export default function Layanan() {
  return (
    <>
      <PageHeader title="Layanan & Paket" description="Fiber optic unlimited tanpa FUP untuk rumah dan bisnis." />
      <PagePlaceholder phase="Fase 4" items={['Biaya instalasi & ringkasan S&K']} />
      {/* Anchor dari mega menu "Layanan" */}
      <Section id="rumah" surface eyebrow="Fase 4" title="Internet Rumah" />
      <Section id="bisnis" eyebrow="Fase 4" title="Internet Bisnis" />
    </>
  )
}
