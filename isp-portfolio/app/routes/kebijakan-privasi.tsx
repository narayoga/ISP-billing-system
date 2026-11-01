import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Kebijakan Privasi',
    description: 'Kebijakan privasi situs dan layanan JITU.',
    path: '/kebijakan-privasi',
  })
}

export default function KebijakanPrivasi() {
  return (
    <>
      <PageHeader title="Kebijakan Privasi" description="Bagaimana kami memperlakukan data Anda." />
      <PagePlaceholder phase="Fase 4" items={['Teks kebijakan privasi']} />
    </>
  )
}
