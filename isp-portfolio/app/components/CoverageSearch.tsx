import { useId, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import type { CoverageArea } from '../content/types'
import { matchLabel, resolve, suggest, type CoverageMatch } from '../lib/coverage'
import { waLink } from '../lib/whatsapp'
import { Badge } from './Badge'
import { Button } from './Button'
import { Icon } from './Icon'
import './CoverageSearch.css'

/** undefined = belum mencari, 'none' = area tidak ditemukan */
type Result = CoverageMatch | 'none' | undefined

type Props = {
  /** 'compact' untuk widget Beranda (di atas latar gradien) */
  variant?: 'full' | 'compact'
  /** Kueri awal, mis. dari ?q= saat datang dari widget Beranda */
  initialQuery?: string
}

/**
 * Pencarian coverage (PRD US-06): saran saat mengetik (combobox ARIA, bisa
 * dipakai dengan keyboard), lalu hasil Tersedia / Segera Hadir / Belum Tersedia
 * beserta tombol aksinya. Semua berjalan di browser tanpa request jaringan.
 *
 * Form tetap ber-action "/coverage" sebagai cadangan tanpa JavaScript; dengan JS,
 * pengiriman dicegat dan hasil tampil langsung.
 */
export function CoverageSearch({ variant = 'full', initialQuery = '' }: Props) {
  const uid = useId()
  const listId = `${uid}-list`
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [result, setResult] = useState<Result>(() => (initialQuery ? (resolve(initialQuery) ?? 'none') : undefined))
  const [searched, setSearched] = useState(initialQuery)

  const suggestions = useMemo(() => suggest(query), [query])
  const showList = open && suggestions.length > 0

  function choose(m: CoverageMatch) {
    const label = matchLabel(m)
    setQuery(label)
    setSearched(label)
    setResult(m)
    setOpen(false)
    setActive(-1)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (showList && active >= 0) return choose(suggestions[active])
    setSearched(query.trim())
    setResult(query.trim() ? (resolve(query) ?? 'none') : undefined)
    setOpen(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <div className={`coverage-search coverage-search--${variant}`}>
      <form action="/coverage" method="get" role="search" className="coverage-search__form" onSubmit={onSubmit}>
        <label htmlFor={`${uid}-q`} className="sr-only">
          Nama desa, kecamatan, atau kota
        </label>
        <Icon name="search" size={20} className="coverage-search__icon" />
        <input
          id={`${uid}-q`}
          name="q"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          placeholder="Contoh: Peliatan"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        <Button type="submit">Cek</Button>

        {showList && (
          <ul id={listId} role="listbox" className="coverage-search__list" aria-label="Saran area">
            {suggestions.map((m, i) => (
              <li
                key={m.kind === 'area' ? m.area.id : `${m.level}-${m.name}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={`coverage-search__option${i === active ? ' is-active' : ''}`}
                // mousedown + preventDefault: input tidak kehilangan fokus sebelum klik terproses
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(m)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <Icon name={m.kind === 'area' ? 'map-pin' : 'building'} size={18} />
                <span className="coverage-search__option-label">
                  {m.kind === 'area' ? m.area.village : m.name}
                  <small>
                    {m.kind === 'area'
                      ? `Kec. ${m.area.district}, ${m.area.city}`
                      : `${m.level === 'kecamatan' ? 'Kecamatan' : 'Kabupaten/Kota'} · ${m.areas.length} desa`}
                  </small>
                </span>
                {m.kind === 'area' && <StatusBadge area={m.area} />}
              </li>
            ))}
          </ul>
        )}
      </form>

      <div aria-live="polite">{result !== undefined && <CoverageResult result={result} query={searched} />}</div>
    </div>
  )
}

function StatusBadge({ area }: { area: CoverageArea }) {
  return area.status === 'tersedia' ? <Badge tone="success">Tersedia</Badge> : <Badge tone="warning">Segera Hadir</Badge>
}

/** Kartu hasil + CTA sesuai status (PRD US-06 AC 2). */
function CoverageResult({ result, query }: { result: Exclude<Result, undefined>; query: string }) {
  if (result === 'none') {
    return (
      <div className="coverage-result coverage-result--none">
        <Badge tone="neutral">Belum Tersedia</Badge>
        <h3>Area “{query}” belum masuk jangkauan kami</h3>
        <p>Ajukan area Anda — permintaan terbanyak kami prioritaskan dalam perluasan jaringan.</p>
        <Button
          variant="whatsapp"
          icon="whatsapp"
          href={waLink('WEB-COVERAGE', `Halo JITU, saya ingin mengajukan area ${query} untuk jaringan JITU.`)}
        >
          Ajukan Area via WhatsApp
        </Button>
      </div>
    )
  }

  if (result.kind === 'group') {
    const ready = result.areas.filter((a) => a.status === 'tersedia').length
    return (
      <div className="coverage-result">
        <Badge tone={ready > 0 ? 'success' : 'warning'}>
          {ready} dari {result.areas.length} desa tersedia
        </Badge>
        <h3>{`${result.level === 'kecamatan' ? 'Kecamatan ' : ''}${result.name}`}</h3>
        <ul className="coverage-result__areas">
          {result.areas.map((a) => (
            <li key={a.id}>
              <span>{a.village}</span>
              <StatusBadge area={a} />
              {a.status === 'tersedia' ? (
                <Link to={`/daftar?area=${a.id}`}>Daftar</Link>
              ) : (
                <a href={waLink('WEB-COVERAGE', notifyMessage(a))} target="_blank" rel="noopener noreferrer">
                  Kabari Saya
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const { area } = result
  const place = `${area.village}, Kec. ${area.district}`
  return area.status === 'tersedia' ? (
    <div className="coverage-result coverage-result--ok">
      <Badge tone="success">Tersedia</Badge>
      <h3>Kabar baik! Jaringan JITU sudah tersedia di {place}.</h3>
      <p>Lanjutkan pendaftaran — alamat Anda akan terisi otomatis di formulir.</p>
      <Button href={`/daftar?area=${area.id}`} iconRight="arrow-right">
        Daftar Sekarang
      </Button>
    </div>
  ) : (
    <div className="coverage-result coverage-result--soon">
      <Badge tone="warning">Segera Hadir</Badge>
      <h3>Jaringan di {place} sedang kami bangun.</h3>
      <p>Tinggalkan kabar lewat WhatsApp — kami hubungi begitu layanan siap dipasang.</p>
      <Button variant="whatsapp" icon="whatsapp" href={waLink('WEB-COVERAGE', notifyMessage(area))}>
        Kabari Saya
      </Button>
    </div>
  )
}

const notifyMessage = (a: CoverageArea) =>
  `Halo JITU, kabari saya saat jaringan tersedia di ${a.village}, Kec. ${a.district}.`
