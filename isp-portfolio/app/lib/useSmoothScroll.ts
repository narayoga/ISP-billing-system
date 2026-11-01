import { useEffect } from 'react'
import Lenis from 'lenis'

let lenis: Lenis | null = null

/** Instans Lenis aktif, atau null bila smooth scroll dimatikan. */
export function getLenis(): Lenis | null {
  return lenis
}

/**
 * Smooth (momentum) scroll global, seperti CMS-portfolio (App.jsx).
 * Dimatikan bila pengguna memilih "kurangi gerakan". Tautan anchor di halaman
 * yang sama (mis. #cabang) ikut di-scroll mulus lewat opsi `anchors`.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = new Lenis({ anchors: true, autoRaf: true })
    lenis = instance
    return () => {
      instance.destroy()
      lenis = null
    }
  }, [])
}
