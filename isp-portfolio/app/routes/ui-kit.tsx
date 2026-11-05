import { useState } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { FeatureCard } from '../components/FeatureCard'
import { Icon } from '../components/Icon'
import { IconBox } from '../components/IconBox'
import type { HeaderHandle } from '../components/layout/Header'
import { PackageCard } from '../components/PackageCard'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { SmoothImg } from '../components/SmoothImg'
import { features } from '../content/features'
import { packages } from '../content/packages'
import { site } from '../content/site'
import type { IconName } from '../content/types'
import { formatPhone, formatRupiah } from '../lib/format'
import { reveal, type RevealVariant } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { waLink } from '../lib/whatsapp'
import './ui-kit.css'

// Halaman review komponen (RENCANA.md Fase 1). Tidak di-prerender dan noindex.
export const handle: HeaderHandle = { header: 'solid' }

export function meta() {
  return pageMeta({ title: 'UI Kit', path: '/ui-kit', noindex: true })
}

const COLORS = [
  ['--color-primary', 'Primer (mainColor)'],
  ['--color-primary-end', 'Ujung gradien'],
  ['--color-brand-orange', 'Oranye logo'],
  ['--color-brand-gray', 'Abu logo'],
  ['--color-heading', 'Judul'],
  ['--color-text', 'Teks'],
  ['--color-muted', 'Paragraf'],
  ['--color-surface', 'Latar section'],
  ['--color-float', 'Widget melayang'],
  ['--color-success', 'Sukses'],
  ['--color-warning', 'Peringatan'],
  ['--color-link', 'Tautan'],
] as const

const GRADIENTS = ['--gradient-primary', '--gradient-purple', '--gradient-blue', '--gradient-orange'] as const

const ICONS: IconName[] = [
  'home', 'building', 'wifi', 'speed', 'shield', 'chart', 'support', 'check', 'whatsapp', 'phone',
  'mail', 'map-pin', 'clock', 'arrow-right', 'chevron-down', 'menu', 'close', 'search', 'copy',
]

const VARIANTS: RevealVariant[] = [
  'fade-in', 'fade-up', 'fade-down', 'slide-left', 'slide-right', 'scale-in', 'zoom-in', 'blur-in',
]

export default function UiKit() {
  // Mengganti key memasang ulang gambar & animasi untuk diulang.
  const [imgKey, setImgKey] = useState(0)
  const [revealKey, setRevealKey] = useState(0)

  return (
    <div className="ui-kit">
      <header className="ui-kit__header">
        <div className="container">
          <SmoothImg src={site.brand.logo.dark} alt={site.brand.name} plain width={96} height={83} />
          <div>
            <h1>UI Kit — {site.brand.name}</h1>
            <p>Review Fase 1: token, komponen dasar, dan fondasi UX. Halaman ini tidak ikut terbit.</p>
          </div>
        </div>
      </header>

      <Section eyebrow="Token" title="Warna & Gradien" description="Diambil dari jagonet.co.id (app/app.css).">
        <div className="ui-kit__swatches">
          {COLORS.map(([token, label]) => (
            <div key={token} className="ui-kit__swatch">
              <span style={{ background: `var(${token})` }} />
              <strong>{label}</strong>
              <code>{token}</code>
            </div>
          ))}
        </div>
        <div className="ui-kit__gradients">
          {GRADIENTS.map((g) => (
            <div key={g} style={{ background: `var(${g})` }}>
              <code>{g}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section surface eyebrow="Token" title="Tipografi">
        <div className="ui-kit__type">
          <h1>Heading 1 — Solusi Tepat Kebutuhan Internet</h1>
          <h2>Heading 2 — Paket dan Harga</h2>
          <h3>Heading 3 — Jagoan 15</h3>
          <p>Paragraf teks body. JITU menghadirkan koneksi internet fiber optic untuk Ubud.</p>
          <p className="ui-kit__muted">Paragraf sekunder (--color-muted) untuk deskripsi.</p>
          <p>
            <a href="#tipografi">Contoh tautan</a>
          </p>
        </div>
      </Section>

      <Section eyebrow="Komponen" title="Tombol & Badge">
        <div className="ui-kit__row">
          <Button>Berlangganan</Button>
          <Button variant="secondary">Cek Coverage</Button>
          <Button variant="whatsapp" icon="whatsapp" href={waLink('WEB-WIDGET')}>
            WhatsApp
          </Button>
          <Button iconRight="arrow-right">Lihat Semua Paket</Button>
          <Button size="sm">Kecil</Button>
          <Button disabled>Nonaktif</Button>
        </div>
        <div className="ui-kit__row ui-kit__row--dark">
          <Button variant="light">Tombol di latar gelap</Button>
          <Button>Primer di latar gelap</Button>
        </div>
        <div className="ui-kit__row">
          <Badge>Most Popular</Badge>
          <Badge tone="success">Tersedia</Badge>
          <Badge tone="warning">Segera Hadir</Badge>
          <Badge tone="neutral">Netral</Badge>
        </div>
      </Section>

      <Section surface eyebrow="Komponen" title="Ikon (SVG inline)">
        <div className="ui-kit__icons">
          {ICONS.map((name) => (
            <div key={name}>
              <Icon name={name} size={24} />
              <code>{name}</code>
            </div>
          ))}
        </div>
        <div className="ui-kit__row">
          <IconBox icon="speed" tone="purple" />
          <IconBox icon="shield" tone="primary" />
          <IconBox icon="chart" tone="blue" />
          <IconBox icon="support" tone="orange" />
        </div>
      </Section>

      <Section
        eyebrow="Keunggulan"
        title="Kartu + Scroll Reveal"
        description="Kartu muncul berurutan saat di-scroll dan terangkat saat hover (pola CMS-portfolio)."
      >
        <Reveal className="grid grid--4">
          {features.map((f, i) => (
            <div key={f.title} {...reveal('fade-up', i * 120)}>
              <FeatureCard feature={f} />
            </div>
          ))}
        </Reveal>
      </Section>

      <Section surface eyebrow="Paket dan Harga" title="Kartu Paket" description="Data sementara: paket JaberNITE Jagonet.">
        <Reveal className="grid grid--3">
          {packages
            .filter((p) => p.featured || p.isCustomPrice)
            .map((p, i) => (
              <div key={p.slug} {...reveal('fade-up', i * 120)}>
                <PackageCard pkg={p} />
              </div>
            ))}
        </Reveal>
      </Section>

      <Section eyebrow="Animasi" title="Varian Scroll Reveal">
        <div className="ui-kit__row">
          <Button size="sm" variant="secondary" onClick={() => setRevealKey((k) => k + 1)}>
            Ulangi animasi
          </Button>
        </div>
        <Reveal key={revealKey} className="grid grid--4">
          {VARIANTS.map((v, i) => (
            <div key={v} {...reveal(v, i * 80, 'ui-kit__reveal-box')}>
              <code>{v}</code>
            </div>
          ))}
        </Reveal>
      </Section>

      <Section surface eyebrow="Gambar" title="SmoothImg" description="Shimmer saat memuat lalu fade-in. Untuk melihat shimmer, aktifkan throttling jaringan (Slow 4G) di DevTools lalu klik Muat ulang.">
        <div className="ui-kit__row">
          <Button size="sm" variant="secondary" onClick={() => setImgKey((k) => k + 1)}>
            Muat ulang gambar
          </Button>
        </div>
        <div className="grid grid--3" key={imgKey}>
          <figure className="ui-kit__figure">
            <SmoothImg src={`${site.brand.logo.dark}?v=${imgKey}`} alt="Logo Balisolusindo (gelap)" width={400} height={192} />
            <figcaption>Standar (shimmer → fade-in)</figcaption>
          </figure>
          <figure className="ui-kit__figure ui-kit__figure--dark">
            <SmoothImg src={`${site.brand.logo.light}?v=${imgKey}`} alt="Logo Balisolusindo (terang)" plain width={400} height={192} />
            <figcaption>Varian plain (logo transparan)</figcaption>
          </figure>
          <figure className="ui-kit__figure">
            <SmoothImg src="/brand/tidak-ada.png" alt="Gambar rusak" width={400} height={300} />
            <figcaption>Gagal muat (tanpa ikon rusak)</figcaption>
          </figure>
        </div>
      </Section>

      <Section eyebrow="Util" title="Format & Tautan">
        <dl className="ui-kit__util">
          <dt>formatRupiah(175500)</dt>
          <dd>{formatRupiah(175_500)}</dd>
          <dt>formatPhone(&apos;6281234567890&apos;)</dt>
          <dd>{formatPhone('6281234567890')}</dd>
          <dt>waLink(&apos;WEB-PAKET&apos;)</dt>
          <dd>
            <code>{waLink('WEB-PAKET')}</code>
          </dd>
        </dl>
      </Section>
    </div>
  )
}
