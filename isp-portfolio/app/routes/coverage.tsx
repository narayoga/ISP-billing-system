import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({
    title: 'Cek Coverage',
    description: 'Cek ketersediaan jaringan internet JITU di desa dan kecamatan Anda di Ubud.',
    path: '/coverage',
  })
}

export default function Coverage() {
  return (
    <>
      <PageHeader title="Cek Coverage" description="Pastikan jaringan JITU sudah tersedia di lokasi Anda." />
      <PagePlaceholder phase="Fase 5" items={['Pencarian desa/kecamatan', 'Hasil: Tersedia / Segera Hadir / Belum Tersedia', 'Daftar lengkap area']} />
    </>
  )
}
