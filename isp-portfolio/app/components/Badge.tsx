import type { ReactNode } from 'react'
import './Badge.css'

type Tone = 'primary' | 'success' | 'warning' | 'neutral'

/** Label kecil; varian primary meniru badge "Most Popular" Jagonet. */
export function Badge({ tone = 'primary', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}
