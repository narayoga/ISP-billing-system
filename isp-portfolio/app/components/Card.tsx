import type { ReactNode } from 'react'
import './Card.css'

type Props = {
  children: ReactNode
  className?: string
  /** Terangkat + bayangan membesar saat hover (pola CMS-portfolio) */
  hover?: boolean
  /** Sorot kartu (mis. paket "Most Popular") dengan garis gradien */
  highlight?: boolean
}

/** Kartu putih bergaya pricing box Jagonet: radius 25px, bayangan lembut. */
export function Card({ children, className, hover = false, highlight = false }: Props) {
  const cls = ['card', hover && 'card--hover', highlight && 'card--highlight', className].filter(Boolean).join(' ')
  return <div className={cls}>{children}</div>
}
