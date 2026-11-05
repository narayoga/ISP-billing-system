import { useRef, type MouseEvent, type ReactNode } from 'react'
import { Icon } from './Icon'
import './Accordion.css'

type Item = { id: string; title: string; content: ReactNode }

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
/** Animasi yang sedang berjalan per item, agar klik cepat beruntun bisa membatalkannya. */
const running = new WeakMap<HTMLDetailsElement, Animation[]>()
/** Item yang masih `open` tetapi sedang dianimasikan menutup. */
const closing = new WeakSet<HTMLDetailsElement>()

function parts(item: HTMLDetailsElement) {
  return {
    body: item.querySelector<HTMLElement>('.accordion__body'),
    text: item.querySelector<HTMLElement>('.accordion__content'),
  }
}

function stop(item: HTMLDetailsElement) {
  running.get(item)?.forEach((a) => a.cancel())
  running.delete(item)
  closing.delete(item)
}

/** Buka: kotak memanjang dulu, lalu teks muncul. */
function expand(item: HTMLDetailsElement) {
  const { body, text } = parts(item)
  const from = item.open && body ? body.offsetHeight : 0 // lanjut dari tinggi saat ini bila sedang menutup
  stop(item)
  item.open = true
  if (!body || !text) return
  running.set(item, [
    body.animate([{ height: `${from}px` }, { height: `${body.scrollHeight}px` }], { duration: 320, easing: EASE }),
    text.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], {
      duration: 260,
      delay: 120,
      easing: 'ease-out',
      fill: 'backwards',
    }),
  ])
}

/** Tutup: teks memudar dulu, lalu kotak menyusut; `open` dilepas setelah selesai. */
function collapse(item: HTMLDetailsElement) {
  const { body, text } = parts(item)
  if (!body || !text) {
    item.open = false
    return
  }
  const from = body.offsetHeight
  stop(item)
  closing.add(item)
  const fade = text.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' })
  const shrink = body.animate([{ height: `${from}px` }, { height: '0px' }], { duration: 260, delay: 60, easing: EASE, fill: 'forwards' })
  running.set(item, [fade, shrink])
  shrink.onfinish = () => {
    item.open = false
    stop(item)
  }
}

/**
 * Akordeon berbasis <details>/<summary>: bisa dibuka-tutup dengan keyboard dan
 * tetap berfungsi tanpa JavaScript (PRD US-04 AC 1). Dengan JavaScript, buka-tutup
 * dianimasikan (Web Animations — jalan di semua peramban) dan hanya satu item
 * terbuka sekaligus; item lain ditutup dengan animasi yang sama. Atribut `name`
 * bawaan sengaja tidak dipakai karena peramban menutup item lain secara instan.
 */
export function Accordion({ items }: { items: Item[] }) {
  const root = useRef<HTMLDivElement>(null)

  function onSummaryClick(e: MouseEvent<HTMLElement>) {
    e.preventDefault()
    const item = e.currentTarget.parentElement as HTMLDetailsElement
    const others = [...(root.current?.querySelectorAll<HTMLDetailsElement>(':scope > details[open]') ?? [])].filter((d) => d !== item)
    const opening = !item.open || closing.has(item)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      others.forEach((d) => (d.open = false))
      item.open = opening
      return
    }
    if (opening) {
      others.forEach((d) => {
        if (!closing.has(d)) collapse(d)
      })
      expand(item)
    } else {
      collapse(item)
    }
  }

  return (
    <div className="accordion" ref={root}>
      {items.map((it) => (
        <details key={it.id} className="accordion__item">
          <summary className="accordion__summary" onClick={onSummaryClick}>
            <span>{it.title}</span>
            <Icon name="chevron-down" size={20} className="accordion__caret" />
          </summary>
          {/* body dianimasikan tingginya (tanpa padding), content memudar */}
          <div className="accordion__body">
            <div className="accordion__content">{it.content}</div>
          </div>
        </details>
      ))}
    </div>
  )
}
