import { Link } from 'react-router'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { IconBox } from '../components/IconBox'
import { PackageCard } from '../components/PackageCard'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { features } from '../content/features'
import { categories, packages } from '../content/packages'
import { site } from '../content/site'
import { formatRupiah } from '../lib/format'
import { reveal } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { serviceLd } from '../lib/structured-data'
import './layanan.css'

export function meta() {
  return pageMeta({
    title: 'Layanan & Paket',
    description: 'Paket internet fiber optic Balisolusindo untuk rumah dan bisnis di Ubud — unlimited tanpa FUP, mulai Rp175.500/bulan.',
    path: '/layanan',
    jsonLd: [serviceLd()],
  })
}

// PRD US-05: semua paket per kategori (urutan sesuai file konten), biaya
// instalasi + ringkasan S&K. Data langsung dari app/content — tanpa request jaringan.
export default function Layanan() {
  const [home, business] = categories
  const homePackages = packages.filter((p) => p.category === home.slug)
  const businessPackages = packages.filter((p) => p.category === business.slug)
  const { fees, terms } = site

  return (
    <>
      <PageHeader title="Layanan & Paket" description="Fiber optic unlimited tanpa FUP untuk rumah dan bisnis di Ubud." />

      {/* Internet Rumah — nuansa JaberNITE LITE (merah muda); anchor dari mega menu */}
      <Section
        id={home.slug}
        className="theme-lite product-section"
        align="left"
        eyebrow={`${home.title} · JaberNITE LITE`}
        title="Paket JaberNITE untuk Rumah"
        description={home.description}
      >
        <Reveal className="package-grid">
          {/* Empat paket muncul bersamaan */}
          {homePackages.map((p) => (
            <div key={p.slug} {...reveal('focus-in')}>
              <PackageCard pkg={p} />
            </div>
          ))}
        </Reveal>
      </Section>

      {/* Internet Bisnis — nuansa JaberNITE HOME (biru); anchor dari mega menu */}
      <Section id={business.slug} className="theme-home product-section">
        <Reveal className="business">
          {/* Kolom kiri naik sebagai satu blok; kolom kanan (paket) masuk dari kanan */}
          <div {...reveal('fade-up', 0, 'business__text')}>
            <span className="section-title__eyebrow">{business.title} · JaberNITE HOME</span>
            <h2 className="business__title">Dedicated Internet untuk Usaha Anda</h2>
            <p>
              {business.description} Kecepatan dan harga disesuaikan kebutuhan — dari kantor kecil hingga hotel dan resort.
            </p>
            <ul className="business__features">
              {features.map((f) => (
                <li key={f.title}>
                  {/* tone primary = biru tema HOME, agar satu nuansa dalam section */}
                  <IconBox icon={f.icon} tone="primary" />
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="business__packages">
            {businessPackages.map((p, i) => (
              <div key={p.slug} {...reveal('slide-right', 200 + i * 100)}>
                <PackageCard pkg={p} />
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* Biaya instalasi & ringkasan S&K (US-05 AC 5) */}
      <Section eyebrow="Biaya & Ketentuan" title="Transparan Sejak Awal">
        <Reveal className="terms-summary">
          <div {...reveal('fade-in')}>
            <Card className="terms-summary__card">
              <div className="terms-summary__fee">
                <span className="terms-summary__fee-label">Biaya instalasi</span>
                <strong>{fees.installation > 0 ? formatRupiah(fees.installation) : 'Gratis'}</strong>
                <span className="terms-summary__fee-note">{fees.taxNote}</span>
              </div>
              <ul className="terms-summary__list">
                {terms.map((t) => (
                  <li key={t}>
                    <Icon name="check" size={18} />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="terms-summary__label">
                *Syarat &amp; ketentuan berlaku. Selengkapnya di <Link to="/syarat-ketentuan">Syarat &amp; Ketentuan</Link>.
              </p>
            </Card>
          </div>
        </Reveal>
        <div className="layanan-cta">
          <p>Belum yakin jaringan sudah sampai rumah Anda?</p>
          <Button href="/coverage" variant="secondary" icon="search">
            Cek Coverage
          </Button>
        </div>
      </Section>
    </>
  )
}
