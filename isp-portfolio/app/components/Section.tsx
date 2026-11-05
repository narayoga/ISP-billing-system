import type { ReactNode } from 'react'
import { reveal } from '../lib/reveal'
import { Reveal } from './Reveal'
import './Section.css'

type Props = {
  id?: string
  /** Latar abu kebiruan Jagonet untuk section selang-seling */
  surface?: boolean
  /** Teks kecil bergradien di atas judul (".sub-title" Jagonet) */
  eyebrow?: string
  /** Boleh berisi elemen, mis. <AnimatedWord> */
  title?: ReactNode
  description?: string
  align?: 'center' | 'left'
  /** Kelas tambahan untuk elemen <section> */
  className?: string
  children?: ReactNode
}

/**
 * Section halaman dengan judul bergaya Jagonet. Judul, sub-judul, dan deskripsi
 * muncul berurutan saat di-scroll (scroll reveal CMS-portfolio).
 */
export function Section({ id, surface, eyebrow, title, description, align = 'center', className, children }: Props) {
  const hasHeader = eyebrow || title || description
  return (
    <section id={id} className={['section', surface && 'section--surface', className].filter(Boolean).join(' ')}>
      <div className="container">
        {hasHeader && (
          // Eyebrow, judul, dan deskripsi masuk sebagai satu blok — bukan tiga baris bertumpuk.
          <Reveal className={`section-title section-title--${align}`}>
            <div {...reveal('rise')}>
              {eyebrow && <span className="section-title__eyebrow">{eyebrow}</span>}
              {title && <h2 className="section-title__heading">{title}</h2>}
              {description && <p className="section-title__description">{description}</p>}
            </div>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  )
}
