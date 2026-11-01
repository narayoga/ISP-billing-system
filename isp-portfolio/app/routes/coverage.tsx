import { useSearchParams } from 'react-router'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { CoverageSearch } from '../components/CoverageSearch'
import { MapView, type MapMarker } from '../components/MapView'
import { PageHeader } from '../components/PageHeader'
import { Section } from '../components/Section'
import { coverage } from '../content/coverage'
import { coverageTree } from '../lib/coverage'
import { pageMeta } from '../lib/seo'
import { useHydrated } from '../lib/useHydrated'
import { waLink } from '../lib/whatsapp'
import './coverage.css'

export function meta() {
  return pageMeta({
    title: 'Cek Coverage',
    description: 'Cek ketersediaan jaringan internet fiber JITU di desa dan kecamatan Anda di Ubud, Gianyar, Bali.',
    path: '/coverage',
  })
}

const tree = coverageTree()
const readyCount = coverage.filter((a) => a.status === 'tersedia').length

// Satu titik ODP per desa; warna mengikuti status (posisi perkiraan, kosmetik).
const odpMarkers: MapMarker[] = coverage.map((a) => ({
  lat: a.odp.lat,
  lng: a.odp.lng,
  label: `ODP ${a.village}`,
  variant: a.status,
  popup: `<strong>ODP ${a.village}</strong><br>${a.status === 'tersedia' ? 'Tersedia — siap dipasang' : 'Segera Hadir — sedang dibangun'}`,
}))

// PRD US-06: pencarian di browser + daftar lengkap area sebagai teks HTML.
export default function Coverage() {
  const [params] = useSearchParams()
  const hydrated = useHydrated()
  // ?q= dari widget Beranda baru dibaca setelah hidrasi (HTML prerender tanpa kueri);
  // key memasang ulang pencarian dengan kueri tersebut sebagai nilai awal.
  const initialQuery = hydrated ? (params.get('q') ?? '') : ''

  return (
    <>
      <PageHeader
        title="Cek Coverage"
        description={`Jaringan JITU sudah menjangkau ${readyCount} desa di Ubud. Pastikan rumah Anda termasuk.`}
      />

      <section className="section coverage-page">
        <div className="container coverage-page__search">
          <p className="coverage-page__hint">Ketik nama desa/kelurahan, kecamatan, atau kabupaten.</p>
          <CoverageSearch key={initialQuery} initialQuery={initialQuery} />
        </div>
      </section>

      {/* Daftar lengkap (teks HTML agar terindeks, US-06 AC 3) + peta titik ODP di kanan */}
      <Section surface id="daftar-area" eyebrow="Area Layanan" title="Daftar Lengkap Area" align="left">
        <div className="coverage-legend">
          <Badge tone="success">Tersedia</Badge> bisa langsung dipasang
          <Badge tone="warning">Segera Hadir</Badge> jaringan sedang dibangun
        </div>

        {/* Daftar & peta setinggi sama; bila area bertambah, daftar di-scroll di dalam panelnya */}
        <div className="coverage-areas">
          <div className="coverage-areas__list" role="region" aria-label="Daftar area layanan" tabIndex={0} data-lenis-prevent>
            {tree.map((c) => (
              <div key={c.city} className="coverage-city">
                <h3 className="coverage-city__name">{c.city}</h3>
                {c.districts.map((d) => (
                  <div key={d.name} className="coverage-district">
                    <h4>Kecamatan {d.name}</h4>
                    <ul>
                      {d.areas.map((a) => (
                        <li key={a.id}>
                          <span>{a.village}</span>
                          <Badge tone={a.status === 'tersedia' ? 'success' : 'warning'}>
                            {a.status === 'tersedia' ? 'Tersedia' : 'Segera Hadir'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <MapView
            className="coverage-areas__map"
            markers={odpMarkers}
            label="Peta titik ODP area layanan JITU"
            legend={
              <>
                <span className="map-legend__item">
                  <span className="map-legend__dot map-legend__dot--tersedia" /> ODP aktif (Tersedia)
                </span>
                <span className="map-legend__item">
                  <span className="map-legend__dot map-legend__dot--segera" /> ODP dibangun (Segera Hadir)
                </span>
              </>
            }
          />
        </div>

        <div className="coverage-request">
          <p>Area Anda belum ada di daftar?</p>
          <Button
            variant="whatsapp"
            icon="whatsapp"
            href={waLink('WEB-COVERAGE', 'Halo JITU, saya ingin mengajukan area baru untuk jaringan JITU.')}
          >
            Ajukan Area
          </Button>
        </div>
      </Section>
    </>
  )
}
