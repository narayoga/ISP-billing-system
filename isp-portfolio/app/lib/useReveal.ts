import { useCallback, useRef, useState } from 'react'

type Options = {
  /** Porsi elemen yang harus terlihat (0–1) */
  threshold?: number
  /** Root margin IntersectionObserver; bottom negatif = terpicu lebih tinggi */
  rootMargin?: string
  /** Hanya terpicu sekali (default true) */
  once?: boolean
}

/**
 * Pemicu scroll reveal, diadaptasi dari CMS-portfolio (hooks/useReveal.js).
 *
 *   const [ref, visible] = useReveal()
 *   <section ref={ref} className={visible ? 'is-visible' : ''}> … </section>
 *
 * Anak berkelas `.reveal` (lihat styles/animations.css) memainkan animasi
 * masuknya saat `visible` true. `ref` berupa callback ref sehingga observer
 * terpasang benar walau elemen baru dirender belakangan.
 *
 * Default memicu saat elemen mencapai ±80% tinggi layar — lebih awal dari
 * CMS-portfolio (-40%) karena mayoritas pengunjung ISP memakai ponsel.
 *
 * Margin atas 200% membuat elemen yang sudah terlewati (berada di atas layar)
 * tetap dianggap terlihat. Tanpa itu, scroll cepat yang melompati elemen —
 * atau membuka halaman langsung di #anchor — meninggalkan area kosong.
 */
export function useReveal<T extends Element = HTMLElement>({
  threshold = 0,
  rootMargin = '200% 0px -20% 0px',
  once = true,
}: Options = {}): [(node: T | null) => void, boolean] {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!node) return

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        },
        { threshold, rootMargin },
      )
      obs.observe(node)
      observerRef.current = obs
    },
    [threshold, rootMargin, once],
  )

  return [ref, visible]
}
