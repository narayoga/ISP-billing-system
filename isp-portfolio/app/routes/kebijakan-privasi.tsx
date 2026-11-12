import { LegalDocument } from '../components/LegalDocument'
import { PageHeader } from '../components/PageHeader'
import { privacy } from '../content/legal'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: privacy.title,
    description: 'Kebijakan privasi situs Balisolusindo — formulir belum mengirim maupun menyimpan data, tanpa cookie.',
    path: '/kebijakan-privasi',
  })
}

export default function KebijakanPrivasi() {
  return (
    <>
      <PageHeader title={privacy.title} description="Bagaimana kami memperlakukan data Anda." />
      <LegalDocument doc={privacy} />
    </>
  )
}
