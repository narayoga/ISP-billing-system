import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'FAQ',
    description: 'Pertanyaan yang sering diajukan seputar layanan internet JITU.',
    path: '/faq',
  })
}

export default function Faq() {
  return (
    <>
      <PageHeader title="FAQ" description="Jawaban atas pertanyaan yang sering diajukan." />
      <PagePlaceholder phase="Fase 4" items={['Tanya-jawab per topik (akordeon)']} />
    </>
  )
}
