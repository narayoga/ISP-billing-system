import { useCallback, useState, type ImgHTMLAttributes } from 'react'
import './SmoothImg.css'

// GIF transparan 1×1 — dipakai saat gagal muat agar ikon gambar rusak & teks alt
// tidak tampil.
const TRANSPARENT = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

type State = 'loading' | 'loaded' | 'instant' | 'error'

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  alt: string
  /** Untuk logo transparan: tanpa kotak shimmer, cukup fade-in */
  plain?: boolean
}

/**
 * Pengganti <img>, diadaptasi dari CMS-portfolio (SmoothImg.jsx): shimmer
 * selama memuat, fade-in setelah selesai, teks alt tidak pernah tampil polos.
 *
 * Penyesuaian untuk prerender: gambar di HTML statis sering sudah selesai
 * dimuat sebelum React aktif, sehingga event onLoad terlewat. Callback ref
 * memeriksa `img.complete` saat terpasang dan langsung menandainya selesai
 * (tanpa animasi fade, supaya gambar yang sudah tampil tidak berkedip).
 */
export function SmoothImg({ src, alt, className, plain = false, onLoad, onError, ...rest }: Props) {
  const [state, setState] = useState<State>('loading')

  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setState(img.naturalWidth > 0 ? 'instant' : 'error')
  }, [])

  const cls = [
    'smooth-img',
    plain && 'smooth-img--plain',
    (state === 'loaded' || state === 'instant') && 'is-loaded',
    state === 'instant' && 'is-instant',
    state === 'error' && 'is-error',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <img
      ref={ref}
      src={state === 'error' ? TRANSPARENT : src}
      alt={alt}
      className={cls}
      onLoad={(e) => {
        setState((s) => (s === 'loading' ? 'loaded' : s))
        onLoad?.(e)
      }}
      onError={(e) => {
        setState('error')
        onError?.(e)
      }}
      {...rest}
    />
  )
}
