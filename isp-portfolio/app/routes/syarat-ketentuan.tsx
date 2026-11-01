import { LegalDocument } from '../components/LegalDocument'
import { PageHeader } from '../components/PageHeader'
import { terms } from '../content/legal'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: terms.title,
    description: 'Syarat dan ketentuan layanan internet JITU — Jagonya Internet Ubud.',
    path: '/syarat-ketentuan',
  })
}

export default function SyaratKetentuan() {
  return (
    <>
      <PageHeader title={terms.title} description="Ketentuan yang berlaku untuk layanan JITU." />
      <LegalDocument doc={terms} />
    </>
  )
}
