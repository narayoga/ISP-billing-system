import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Icon } from '../components/Icon'
import { IconBox } from '../components/IconBox'
import { MapView, type MapMarker } from '../components/MapView'
import { Masonry } from '../components/Masonry'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { SmoothImg } from '../components/SmoothImg'
import { features } from '../content/features'
import { gallery } from '../content/gallery'
import { site } from '../content/site'
import { formatPhone } from '../lib/format'
import { reveal } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { telLink, waLink } from '../lib/whatsapp'
import './tentang.css'

export function meta() {
  return pageMeta({
    title: 'Tentang Kami',
    description: 'Profil JITU — Jagonya Internet Ubud, layanan internet Jagonet di Ubud, Bali: visi, misi, dan lokasi cabang.',
    path: '/tentang',
  })
}

// Titik kantor di peta Lokasi (array tetap di luar komponen agar peta tidak dibuat ulang).
const officeMarker: MapMarker[] = [
  { lat: site.address.geo.lat, lng: site.address.geo.lng, label: site.branches[0]?.name ?? site.brand.name },
]

// PRD US-02: profil, visi-misi, galeri masonry, cabang/POP + peta.
export default function Tentang() {
  const { profile, branches } = site
  return (
    <>
      <PageHeader title="Tentang Kami" description="Mengenal JITU — Jagonya Internet Ubud, bagian dari keluarga Jagonet." />

      {/* Profil */}
      <section className="section">
        <Reveal className="container about-profile">
          <div className="about-profile__text">
            <span {...reveal('fade-up', 0, 'section-title__eyebrow')}>Profil Perusahaan</span>
            <h2 {...reveal('fade-up', 100, 'about-profile__title')}>Internet Jagonet, Dekat dengan Warga Ubud</h2>
            <p {...reveal('fade-up', 200)}>{profile.about}</p>
            <ul {...reveal('fade-up', 300, 'about-profile__points')}>
              {features.map((f) => (
                <li key={f.title}>
                  <Icon name="check" size={18} />
                  {f.title}
                </li>
              ))}
            </ul>
            <div {...reveal('fade-up', 400)}>
              <Button href="/kontak" iconRight="arrow-right">
                Hubungi Kami
              </Button>
            </div>
          </div>
          <div {...reveal('slide-right', 150, 'about-profile__media')}>
            <SmoothImg
              src="/images/hero-kota.webp"
              alt="Ilustrasi jaringan internet kota"
              width={1100}
              height={1012}
              plain
              loading="lazy"
              decoding="async"
            />
          </div>
        </Reveal>
      </section>

      {/* Visi & misi — anchor dari mega menu */}
      <Section id="visi-misi" surface eyebrow="Visi & Misi" title="Komitmen Kami untuk Ubud">
        <Reveal className="about-vm">
          <div {...reveal('fade-up', 0)}>
            <Card className="about-vm__vision">
              <IconBox icon="shield" tone="primary" />
              <h3>Visi</h3>
              <p>{profile.vision}</p>
            </Card>
          </div>
          <ol className="about-vm__mission">
            {profile.mission.map((m, i) => (
              <li key={m} {...reveal('fade-up', 120 + i * 120)}>
                <span className="about-vm__num">{String(i + 1).padStart(2, '0')}</span>
                <p>{m}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      {/* Galeri masonry — pola daftar proyek CMS-portfolio; hanya bila ada foto (US-02 AC 3) */}
      {gallery.length > 0 && (
        <Section id="galeri" eyebrow="Galeri" title="Kegiatan Kami di Lapangan" align="left">
          <Masonry items={gallery} />
        </Section>
      )}

      {/* Cabang & POP + peta OpenStreetMap — anchor dari mega menu */}
      <Section id="cabang" surface eyebrow="Cabang & POP" title="Lokasi Kami" description="Kunjungi kantor atau hubungi cabang terdekat." align="left">
        <div className="about-location">
          <Reveal className="about-location__branches">
            {branches.map((b, i) => (
              <div key={b.name} {...reveal('fade-up', i * 120)}>
                <Card hover className="about-branch">
                  <span className="about-branch__icon">
                    <Icon name="map-pin" size={22} />
                  </span>
                  <h3>{b.name}</h3>
                  <p>{b.address}</p>
                  {b.phone ? (
                    <a href={telLink(b.phone)} className="about-branch__link">
                      <Icon name="phone" size={16} /> {formatPhone(b.phone)}
                    </a>
                  ) : (
                    <a href={waLink('WEB-KONTAK')} target="_blank" rel="noopener noreferrer" className="about-branch__link">
                      <Icon name="whatsapp" size={16} /> Hubungi via WhatsApp
                    </a>
                  )}
                  <a href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer" className="about-branch__link">
                    <Icon name="map-pin" size={16} /> Petunjuk arah
                  </a>
                </Card>
              </div>
            ))}
          </Reveal>
          <MapView markers={officeMarker} label={`Peta lokasi ${officeMarker[0].label}`} />
        </div>
      </Section>
    </>
  )
}
