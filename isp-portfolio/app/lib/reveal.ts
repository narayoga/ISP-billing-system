import type { CSSProperties } from 'react'

export type RevealVariant =
  | 'fade-in'
  | 'fade-up'
  | 'fade-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'zoom-in'
  | 'blur-in'

/**
 * Kelas + jeda untuk anak di dalam <Reveal> (lihat styles/animations.css):
 *   <div {...reveal('fade-up', i * 120, 'card-grid__item')}>
 */
export function reveal(
  variant: RevealVariant = 'fade-up',
  delayMs = 0,
  className?: string,
): { className: string; style: CSSProperties } {
  return {
    className: ['reveal', `reveal--${variant}`, className].filter(Boolean).join(' '),
    style: { '--reveal-delay': `${delayMs}ms` } as CSSProperties,
  }
}
