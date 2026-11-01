import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import type { MegaMenu as MegaMenuData } from '../../content/types'
import { Icon } from '../Icon'
import { IconBox } from '../IconBox'

type Props = {
  id: string
  data: MegaMenuData
  open: boolean
  onNavigate: () => void
}

/**
 * Panel selebar layar di bawah header, pola mega menu CMS-portfolio: panel kiri
 * (ikon, judul, subjudul, CTA) + kolom tautan di kanan. Selalu dirender agar
 * transisi buka/tutup mulus; saat tertutup dibuat `inert` (tak terjangkau Tab).
 */
export function MegaMenu({ id, data, open, onNavigate }: Props) {
  return (
    <div id={id} className={`mega${open ? ' is-open' : ''}`} inert={!open}>
      <div className="container mega__inner">
        <div className="mega__intro">
          <IconBox icon={data.icon} tone={data.tone} />
          <p className="mega__title">{data.title}</p>
          <p className="mega__subtitle">{data.subtitle}</p>
          <Link to={data.cta.to} className="mega__cta" onClick={onNavigate}>
            {data.cta.label}
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>
        <ul className="mega__links">
          {data.links.map((link, i) => (
            <li key={link.to + link.label} style={{ '--i': i } as CSSProperties}>
              <Link to={link.to} className="mega__link" onClick={onNavigate}>
                {link.icon && (
                  <span className="mega__link-icon">
                    <Icon name={link.icon} size={20} />
                  </span>
                )}
                <span>
                  <span className="mega__link-label">{link.label}</span>
                  {link.description && <span className="mega__link-desc">{link.description}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
