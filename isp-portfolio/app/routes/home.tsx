import { Link } from 'react-router'
import { Accordion } from '../components/Accordion'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CoverageSearch } from '../components/CoverageSearch'
import { FeatureCard } from '../components/FeatureCard'
import { AnimatedWord } from '../components/home/AnimatedWord'
import { HeroSlider } from '../components/home/HeroSlider'
import { Icon } from '../components/Icon'
import { Marquee } from '../components/Marquee'
import { PackageCard } from '../components/PackageCard'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { SmoothImg } from '../components/SmoothImg'
import { faq } from '../content/faq'
import { features } from '../content/features'
import { categoryImages, headlineWords, heroSlides, partners, steps } from '../content/home'
import { categories, packages } from '../content/packages'
import { stats } from '../content/stats'
import { reveal } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { waLink } from '../lib/whatsapp'
import './home.css'

export function meta() {
  return pageMeta({ path: '/' })
}

const featured = packages.filter((p) => p.featured).slice(0, 3) // PRD US-01 AC 3
const topFaq = faq.slice(0, 5)

// Urutan section mengikuti PRD §3 "Urutan Section Beranda".
export default function Home() {
  return (
    <>
      {/* 1. Hero */}
      <HeroSlider slides={heroSlides} />

      {/* 2. Kategori layanan */}
      <Section
        eyebrow="Layanan Kami"
        title="Internet untuk Rumah dan Bisnis"
        description="Pilih layanan sesuai kebutuhan — dari streaming keluarga hingga operasional villa dan kantor."
      >
        <Reveal className="grid grid--2">
          {categories.map((c, i) => (
            <div key={c.slug} {...reveal('fade-up', i * 120)}>
              <Link to={`/layanan#${c.slug}`} className="category-card">
                <Card hover className="category-card__inner">
                  <div className="category-card__media">
                    <SmoothImg
                      src={categoryImages[c.slug].src}
                      width={categoryImages[c.slug].width}
                      height={categoryImages[c.slug].height}
                      alt=""
                      plain
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="category-card__body">
                    <h3>{c.title}</h3>
                    <p>{c.description}</p>
                    <span className="category-card__more">
                      Lihat paket <Icon name="arrow-right" size={16} />
                    </span>
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* 3. Keunggulan */}
      <Section
        surface
        eyebrow="Keunggulan"
        title={
          <>
            Internet <AnimatedWord words={headlineWords} />
            <br />
            untuk Ubud dan Sekitarnya
          </>
        }
        description="Infrastruktur dan dukungan Jagonet, kini lebih dekat dengan Anda."
      >
        <Reveal className="grid grid--4">
          {features.map((f, i) => (
            <div key={f.title} {...reveal('fade-up', i * 120)}>
              <FeatureCard feature={f} />
            </div>
          ))}
        </Reveal>
      </Section>

      {/* 4. Statistik — hanya tampil bila angkanya sudah diisi (US-01 AC 1, AC 4) */}
      {stats.length > 0 && (
        <section className="stats">
          <Reveal className="container stats__grid">
            {stats.map((s, i) => (
              <div key={s.label} {...reveal('fade-up', i * 100, 'stats__item')}>
                <p className="stats__value">
                  {s.value.toLocaleString('id-ID')}
                  {s.suffix}
                </p>
                <p className="stats__label">{s.label}</p>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* 5. Paket unggulan */}
      <Section
        eyebrow="Paket dan Harga"
        title="Kami Transparan Masalah Harga"
        description="Semua paket unlimited tanpa FUP dengan kecepatan upload sama dengan download."
      >
        <Reveal className="grid grid--3">
          {featured.map((p, i) => (
            <div key={p.slug} {...reveal('fade-up', i * 120)}>
              <PackageCard pkg={p} />
            </div>
          ))}
        </Reveal>
        <div className="home-center">
          <Button href="/layanan" variant="secondary" iconRight="arrow-right">
            Lihat Semua Paket
          </Button>
        </div>
      </Section>

      {/* 6. Cara berlangganan */}
      <Section surface eyebrow="Cara Berlangganan" title="Empat Langkah Mudah">
        <Reveal as="ol" className="steps">
          {steps.map((s, i) => (
            <li key={s.title} {...reveal('fade-up', i * 120, 'steps__item')}>
              <span className="steps__icon">
                <Icon name={s.icon} size={26} />
                <span className="steps__number">{i + 1}</span>
              </span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </li>
          ))}
        </Reveal>
      </Section>

      {/* 7. CTA coverage — widget mini dengan logika & data yang sama dengan /coverage (US-06 AC 5) */}
      <section className="coverage-cta">
        <Reveal className="container coverage-cta__inner">
          <div {...reveal('slide-left', 0, 'coverage-cta__text')}>
            <h2>Cek Ketersediaan Jaringan di Lokasi Anda</h2>
            <p>Ketik nama desa atau kecamatan untuk memastikan JITU sudah menjangkau rumah Anda.</p>
          </div>
          <div {...reveal('slide-right', 120, 'coverage-cta__search')}>
            <CoverageSearch variant="compact" />
          </div>
        </Reveal>
      </section>

      {/* 8. Partner — opsional, hanya bila materi nyata tersedia */}
      {partners.length > 0 && (
        <Section eyebrow="Partner" title="Bermitra dengan Perusahaan Teknologi Terpercaya">
          <Marquee>
            {partners.map((p) => (
              <img key={p.name} src={p.logo} alt={p.name} className="partner-logo" loading="lazy" />
            ))}
          </Marquee>
        </Section>
      )}

      {/* 9. FAQ singkat */}
      <Section surface eyebrow="FAQ" title="Pertanyaan yang Sering Diajukan">
        <Reveal className="home-faq">
          <div {...reveal('fade-up')}>
            <Accordion
              name="home-faq"
              items={topFaq.map((q, i) => ({ id: `faq-${i}`, title: q.question, content: <p>{q.answer}</p> }))}
            />
          </div>
        </Reveal>
        <div className="home-center">
          <Button href="/faq" variant="secondary" iconRight="arrow-right">
            Lihat Semua FAQ
          </Button>
        </div>
      </Section>

      {/* 10. CTA penutup */}
      <section className="closing-cta">
        <Reveal className="container closing-cta__inner">
          <h2 {...reveal('fade-up')}>Siap Menikmati Internet Tanpa Batas?</h2>
          <p {...reveal('fade-up', 100)}>Daftar sekarang atau tanyakan dulu ke tim kami — gratis konsultasi.</p>
          <div {...reveal('fade-up', 200, 'closing-cta__actions')}>
            <Button href="/daftar" variant="light">
              Berlangganan Sekarang
            </Button>
            <Button href={waLink('WEB-HERO', 'Halo JITU, saya ingin berlangganan internet.')} variant="whatsapp" icon="whatsapp">
              Chat WhatsApp
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  )
}
