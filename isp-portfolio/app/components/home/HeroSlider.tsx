import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import type { HeroSlide } from '../../content/types'
import { Button } from '../Button'
import './HeroSlider.css'

const DURATION = 6000 // ms per slide (CMS-portfolio)
const EXIT_MS = 450 // harus ≥ durasi heroContentOut (0,35 s) di HeroSlider.css
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
 * pergantian otomatis 6 detik, teks & tombol muncul berurutan, bar progres, swipe.
 *
 * Penyesuaian untuk JITU:
 * - Latar gelap diam. Isi slide lama memudar sambil bergeser sedikit, isi slide
 *   baru masuk dari arah berlawanan dengan elemen-elemennya berurutan — tanpa
 *   jeda kosong di antaranya.
 * - Slide pertama sudah tampil di HTML prerender (tanpa menunggu JavaScript).
 * - Pergantian dipicu akhir animasi bar progres. Hover/fokus menjeda animasi bar
 *   lewat CSS (`:hover`, `:focus-within`), sehingga timer ikut berhenti.
 * - "Kurangi gerakan" mematikan pergantian otomatis dan semua animasi.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length
  const [idx, setIdx] = useState(0)
  const [exitIdx, setExitIdx] = useState<number | null>(null)
  const [dir, setDir] = useState<'next' | 'prev'>('next')
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, getReducedMotionServer)
  const exitTimer = useRef<number | undefined>(undefined)
  const drag = useRef<{ x: number; moved: boolean } | null>(null)

  const go = useCallback(
    (next: number, direction: 'next' | 'prev') => {
      if (next === idx) return
      window.clearTimeout(exitTimer.current)
      setDir(direction)
      setExitIdx(idx)
      setIdx(next)
      exitTimer.current = window.setTimeout(() => setExitIdx(null), reducedMotion ? 0 : EXIT_MS)
    },
    [idx, reducedMotion],
  )

  const next = useCallback(() => go((idx + 1) % n, 'next'), [go, idx, n])
  const prev = useCallback(() => go((idx - 1 + n) % n, 'prev'), [go, idx, n])

  const autoplay = n > 1 && !reducedMotion

  return (
    <section
      className={`hero dir-${dir}`}
      aria-roledescription="carousel"
      aria-label="Sorotan JITU"
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
          const cls = ['hero-slide', isActive && 'is-active', isExiting && 'is-exiting'].filter(Boolean).join(' ')
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
        </div>
      )}
    </section>
  )
}
