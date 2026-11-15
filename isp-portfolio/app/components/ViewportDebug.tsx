import { useEffect, useState } from 'react'

type Info = Record<string, string | number>

/**
 * SEMENTARA — panel diagnosis bug header ponsel (header "terdorong" ke atas saat
 * address bar browser menyembunyikan diri). Hanya muncul bila URL memuat
 * `?debug=viewport`; pengunjung biasa tidak melihatnya. Hapus setelah bug beres.
 */
export function ViewportDebug() {
  const [info, setInfo] = useState<Info | null>(null)

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return
    let frame = 0
    const read = () => {
      frame = 0
      const vv = window.visualViewport
      const header = document.querySelector('.site-header')?.getBoundingClientRect()
      const doc = document.documentElement
      // Elemen terlebar yang melampaui lebar layar (penyebab umum "layout viewport" melebar)
      let widest = '-'
      if (doc.scrollWidth > doc.clientWidth) {
        let max = doc.clientWidth
        for (const el of document.body.querySelectorAll('*')) {
          const right = el.getBoundingClientRect().right
          if (right > max) {
            max = right
            widest = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} → ${Math.round(right)}px`
          }
        }
      }
      setInfo({
        'inner W×H': `${window.innerWidth}×${window.innerHeight}`,
        'client W×H': `${doc.clientWidth}×${doc.clientHeight}`,
        'scrollWidth': doc.scrollWidth,
        'vv W×H': vv ? `${Math.round(vv.width)}×${Math.round(vv.height)}` : '-',
        'vv scale': vv ? vv.scale.toFixed(3) : '-',
        'vv offsetTop': vv ? Math.round(vv.offsetTop) : '-',
        'vv pageTop': vv ? Math.round(vv.pageTop) : '-',
        'scrollY': Math.round(window.scrollY),
        'header top': header ? Math.round(header.top) : '-',
        'header H': header ? Math.round(header.height) : '-',
        'DPR': window.devicePixelRatio,
        'terlebar': widest,
      })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
    }
  }, [])

  if (!info) return null
  return (
    <pre
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 1000,
        margin: 0,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgb(0 0 0 / 0.78)',
        color: '#7CFC9A',
        font: '11px/1.45 ui-monospace, Consolas, monospace',
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}
    >
      {Object.entries(info)
        .map(([k, v]) => `${k.padEnd(13)} ${v}`)
        .join('\n')}
    </pre>
  )
}
