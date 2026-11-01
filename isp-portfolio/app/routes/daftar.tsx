import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Daftar Berlangganan',
    description: 'Formulir pendaftaran berlangganan internet JITU.',
    path: '/daftar',
  })
}

export default function Daftar() {
  return (
    <>
      <PageHeader title="Daftar Berlangganan" description="Isi data Anda untuk mulai berlangganan internet JITU." />
      <PagePlaceholder phase="Fase 6" items={['Formulir 28 field dengan validasi', 'Alamat berjenjang, foto KTP, tanda tangan', 'Modal Segera Hadir + WhatsApp']} />
    </>
  )
}
