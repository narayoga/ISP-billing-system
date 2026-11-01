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
          <Reveal className={`section-title section-title--${align}`}>
            {eyebrow && <span {...reveal('fade-up', 0, 'section-title__eyebrow')}>{eyebrow}</span>}
            {title && <h2 {...reveal('fade-up', 100, 'section-title__heading')}>{title}</h2>}
            {description && <p {...reveal('fade-up', 200, 'section-title__description')}>{description}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  )
}
