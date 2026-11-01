import type { GalleryItem } from '../content/types'
import { reveal } from '../lib/reveal'
import { Reveal } from './Reveal'
import { SmoothImg } from './SmoothImg'
import './Masonry.css'

/**
 * Galeri masonry — pola daftar proyek CMS-portfolio (ProjectList): kolom CSS
 * sama lebar, tinggi mengikuti rasio foto (sudah di-crop di sumbernya), lalu
 * tahun, judul, dan kategori di bawah foto. Tiap kartu punya pemicu scroll
 * reveal sendiri karena kolomnya tinggi.
 */
export function Masonry({ items }: { items: GalleryItem[] }) {
  return (
    <div className="masonry">
      {items.map((it, i) => (
        <Reveal key={it.src} as="figure" className="masonry__item">
          <div {...reveal('fade-up', (i % 3) * 100, 'masonry__card')}>
            <div className="masonry__img">
              <SmoothImg src={it.src} alt={it.alt} width={it.width} height={it.height} loading="lazy" decoding="async" />
            </div>
            <figcaption>
              <span className="masonry__year">{`Tahun ${it.year}`}</span>
              <span className="masonry__title">{it.title}</span>
              <span className="masonry__category">{it.category}</span>
            </figcaption>
          </div>
        </Reveal>
      ))}
    </div>
  )
}
