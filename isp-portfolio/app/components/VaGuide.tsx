import { useRef, useState, type KeyboardEvent } from 'react'
import { vaBanks } from '../content/payment'
import { Accordion } from './Accordion'
import './VaGuide.css'

/**
 * Panduan bayar Virtual Account: tab bank (pola ARIA tabs, panah kiri/kanan),
 * lalu akordeon per kanal (m-banking, ATM, internet banking).
 */
export function VaGuide() {
  const [active, setActive] = useState(vaBanks[0].id)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const bank = vaBanks.find((b) => b.id === active) ?? vaBanks[0]

  /** Pilih bank; di ponsel daftar tab bergulir, jadi tab aktif digeser ke tampilan. */
  function select(i: number) {
    setActive(vaBanks[i].id)
    tabs.current[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }

  function onKeyDown(e: KeyboardEvent, i: number) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? vaBanks.length - 1 : (i + step + vaBanks.length) % vaBanks.length
    if (!step && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    select(next)
    tabs.current[next]?.focus({ preventScroll: true })
  }

  return (
    <div className="va-guide">
      <div className="va-guide__tabs" role="tablist" aria-label="Pilih bank">
        {vaBanks.map((b, i) => (
          <button
            key={b.id}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            id={`va-tab-${b.id}`}
            aria-selected={b.id === active}
            aria-controls="va-panel"
            tabIndex={b.id === active ? 0 : -1}
            className="va-guide__tab"
            onClick={() => select(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {b.name}
          </button>
        ))}
      </div>
      <div key={bank.id} id="va-panel" role="tabpanel" aria-labelledby={`va-tab-${bank.id}`} className="va-guide__panel">
        <Accordion
          name={`va-${bank.id}`}
          items={bank.channels.map((c) => ({
            id: c.name,
            title: c.name,
            content: (
              <ol className="va-guide__steps">
                {c.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            ),
          }))}
        />
      </div>
    </div>
  )
}
