import type { CSSProperties, ReactNode } from 'react'
import './Marquee.css'

/**
 * Pita berjalan tanpa putus, dari CMS-portfolio (Home.jsx MarqueeStrip): isi
 * digandakan agar loop mulus. Set kedua disembunyikan dari pembaca layar.
 */
export function Marquee({ children, speed = 30, reverse = false }: { children: ReactNode; speed?: number; reverse?: boolean }) {
  return (
    <div className="marquee">
      <div
        className={`marquee__track${reverse ? ' marquee__track--reverse' : ''}`}
        style={{ '--marquee-speed': `${speed}s` } as CSSProperties}
      >
        <div className="marquee__set">{children}</div>
        <div className="marquee__set" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
