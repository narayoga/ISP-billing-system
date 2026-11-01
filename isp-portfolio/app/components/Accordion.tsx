import type { ReactNode } from 'react'
import { Icon } from './Icon'
import './Accordion.css'

type Item = { id: string; title: string; content: ReactNode }

/**
 * Akordeon berbasis <details>/<summary>: bisa dibuka-tutup dengan keyboard dan
 * tetap berfungsi tanpa JavaScript (PRD US-04 AC 1). Atribut `name` membuat
 * hanya satu item terbuka sekaligus di peramban yang mendukungnya.
 */
export function Accordion({ items, name }: { items: Item[]; name: string }) {
  return (
    <div className="accordion">
      {items.map((it) => (
        <details key={it.id} name={name} className="accordion__item">
          <summary className="accordion__summary">
            <span>{it.title}</span>
            <Icon name="chevron-down" size={20} className="accordion__caret" />
          </summary>
          <div className="accordion__content">{it.content}</div>
        </details>
      ))}
    </div>
  )
}
