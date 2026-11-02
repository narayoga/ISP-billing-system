import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import './CopyButton.css'

/** Tombol "Salin" satu klik (PRD US-08 AC 4); label berubah "Tersalin" sejenak. */
export function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const t = window.setTimeout(() => setState('idle'), 2000)
    return () => window.clearTimeout(t)
  }, [state])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState('done')
    } catch {
      // Clipboard API ditolak (HTTP biasa, izin, dokumen tak fokus) → cara lama.
      setState(legacyCopy(text) ? 'done' : 'error')
    }
  }

  return (
    <button type="button" className={`copy-btn copy-btn--${state}`} onClick={copy} aria-label={`${label} ${text}`}>
      <Icon name={state === 'done' ? 'check' : 'copy'} size={16} />
      <span aria-live="polite">{state === 'done' ? 'Tersalin' : state === 'error' ? 'Gagal' : label}</span>
    </button>
  )
}

function legacyCopy(text: string): boolean {
  const prev = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.append(ta)
  ta.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    ta.remove()
    prev?.focus()
  }
}
