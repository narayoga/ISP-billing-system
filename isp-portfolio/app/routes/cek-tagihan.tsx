import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Cek Tagihan',
    description: 'Cek tagihan dan cara pembayaran layanan internet JITU.',
    path: '/cek-tagihan',
  })
}

export default function CekTagihan() {
  return (
    <>
      <PageHeader title="Cek Tagihan" description="Lihat tagihan dan cara pembayaran layanan Anda." />
      <PagePlaceholder phase="Fase 7" items={['Form ID pelanggan / nomor WhatsApp', 'Cara pembayaran']} />
    </>
  )
}
