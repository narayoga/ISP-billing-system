import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Syarat & Ketentuan',
    description: 'Syarat dan ketentuan layanan internet JITU.',
    path: '/syarat-ketentuan',
  })
}

export default function SyaratKetentuan() {
  return (
    <>
      <PageHeader title="Syarat & Ketentuan" description="Ketentuan yang berlaku untuk layanan JITU." />
      <PagePlaceholder phase="Fase 4" items={['Teks syarat & ketentuan']} />
    </>
  )
}
