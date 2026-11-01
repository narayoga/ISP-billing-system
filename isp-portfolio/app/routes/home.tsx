import { PageHeader } from '../components/PageHeader'
import { PagePlaceholder } from '../components/PagePlaceholder'
import { site } from '../content/site'
import { pageMeta } from '../lib/seo'

export function meta() {
  return pageMeta({ path: '/' })
}

// Sementara: hero slider & seluruh section Beranda dibangun di Fase 3.
export default function Home() {
  return (
    <>
      <PageHeader title={site.seo.defaultTitle} description={site.brand.tagline} crumb={null} />
      <PagePlaceholder
        phase="Fase 3"
        items={[
          'Hero slider layar penuh',
          'Kategori layanan & keunggulan',
          'Paket unggulan & cara berlangganan',
          'CTA coverage, FAQ singkat, CTA penutup',
        ]}
      />
    </>
  )
}
