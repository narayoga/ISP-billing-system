import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import type { HeroSlide } from '../../content/types'
import { Button } from '../Button'
import { Icon } from '../Icon'
import './HeroSlider.css'

const DURATION = 6000 // ms per slide (CMS-portfolio)
const TRANSITION = 700 // harus sama dengan animasi di HeroSlider.css
const SWIPE_PX = 60

function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}
const getReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const getReducedMotionServer = () => false

/**
 * Hero slider layar penuh, diadaptasi dari CMS-portfolio (HeroSlider.jsx):
 * slide bergeser, teks & tombol muncul berurutan, bar progres, panah, swipe.
 *
 * Penyesuaian untuk JITU:
 * - Latar gelap tetap diam; hanya isi slide (teks + ilustrasi) yang bergeser,
 *   sehingga header transparan selalu punya latar di belakangnya.
 * - Slide pertama sudah tampil di HTML prerender (tanpa menunggu JavaScript).
 * - Pergantian otomatis dipicu oleh akhir animasi bar progres, sehingga jeda
 *   (hover, fokus, tombol jeda) menghentikan bar dan timer sekaligus.
 * - "Kurangi gerakan" mematikan pergantian otomatis dan animasi geser.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length
  const [idx, setIdx] = useState(0)
  const [exitIdx, setExitIdx] = useState<number | null>(null)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getReducedMotionServer)
  const locked = useRef(false)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)

  const go = useCallback(
    (next: number, direction: 'next' | 'prev') => {
      if (locked.current || next === idx) return
      locked.current = true
      setDir(direction)
      setExitIdx(idx)
      setIdx(next)
      window.setTimeout(() => {
        setExitIdx(null)
        locked.current = false
      }, reducedMotion ? 0 : TRANSITION)
    },
    [idx, reducedMotion],
  )

  const next = useCallback(() => go((idx + 1) % n, 'next'), [go, idx, n])
  const prev = useCallback(() => go((idx - 1 + n) % n, 'prev'), [go, idx, n])

  const paused = hovered || focused || userPaused || reducedMotion
  const autoplay = n > 1 && !reducedMotion

  return (
    <section
      className={`hero${paused ? ' is-paused' : ''}`}
      aria-roledescription="carousel"
      aria-label="Sorotan JITU"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, moved: false }
      }}
      onPointerUp={(e) => {
        if (!drag.current) return
        const delta = drag.current.x - e.clientX
        if (Math.abs(delta) > SWIPE_PX && n > 1) {
          drag.current.moved = true
          if (delta > 0) next()
          else prev()
        }
      }}
      // Geser jari tidak boleh sekaligus terhitung klik tombol/tautan di slide.
      onClickCapture={(e) => {
        if (drag.current?.moved) e.preventDefault()
        drag.current = null
      }}
    >
      <div className="hero__slides">
        {slides.map((s, i) => {
          const isActive = i === idx
          const isExiting = i === exitIdx
          const cls = [
            'hero-slide',
            isActive && 'is-active',
            isExiting && 'is-exiting',
            (isActive || isExiting) && exitIdx !== null && `dir-${dir}`,
          ]
            .filter(Boolean)
            .join(' ')
          const Heading = i === 0 ? 'h1' : 'h2'
          return (
            <div
              key={s.id}
              className={cls}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${n}: ${s.eyebrow}`}
              aria-hidden={!isActive}
              inert={!isActive}
            >
              <div className="container hero-slide__inner">
                <div className="hero-slide__text">
                  <p className="hero-slide__eyebrow">{s.eyebrow}</p>
                  <Heading className="hero-slide__title">{s.title}</Heading>
                  <p className="hero-slide__desc">{s.text}</p>
                  <div className="hero-slide__actions">
                    <Button href={s.primary.href} icon={s.primary.icon}>
                      {s.primary.label}
                    </Button>
                    {s.secondary && (
                      <Button href={s.secondary.href} variant="light" icon={s.secondary.icon}>
                        {s.secondary.label}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="hero-slide__media">
                  <img
                    src={s.image.src}
                    alt={s.image.alt}
                    width={s.image.width}
                    height={s.image.height}
                    draggable={false}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {n > 1 && (
        <div className="hero__controls container">
          <div className="hero__progress">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="hero__progress-track"
                aria-label={`Tampilkan slide ${i + 1}: ${s.eyebrow}`}
                aria-current={i === idx ? 'true' : undefined}
                onClick={() => go(i, i > idx ? 'next' : 'prev')}
              >
                <span
                  // key berisi idx agar animasi isi bar mulai ulang tiap slide aktif
                  key={`${i}-${idx}`}
                  className={['hero__progress-fill', i === idx && autoplay && 'is-running', i < idx && 'is-done']
                    .filter(Boolean)
                    .join(' ')}
                  style={i === idx ? { animationDuration: `${DURATION}ms` } : undefined}
                  onAnimationEnd={i === idx ? next : undefined}
                />
              </button>
            ))}
          </div>
          <div className="hero__buttons">
            <button
              type="button"
              className="hero__btn"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Putar slide otomatis' : 'Jeda slide otomatis'}
              hidden={!autoplay}
            >
              {userPaused ? <PlayGlyph /> : <PauseGlyph />}
            </button>
            <button type="button" className="hero__btn" onClick={prev} aria-label="Slide sebelumnya">
              <Icon name="chevron-down" size={22} className="hero__arrow hero__arrow--prev" />
            </button>
            <button type="button" className="hero__btn" onClick={next} aria-label="Slide berikutnya">
              <Icon name="chevron-down" size={22} className="hero__arrow hero__arrow--next" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  )
}
