import { useEffect, useId, useRef, type ReactNode } from 'react'
import { getLenis } from '../lib/useSmoothScroll'
import { Icon } from './Icon'
import './Modal.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Modal berbasis <dialog> + showModal(): peramban mengunci fokus di dalam
 * modal, Esc menutup, dan fokus kembali ke pemicu (PRD US-11 AC 2).
 * Klik di luar panel juga menutup. Smooth scroll dijeda selama terbuka.
 */
export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Cadangan: bila dialog ditutup oleh peramban (event `close` bawaan), state
  // tetap disinkronkan — kalau tidak, modal tak bisa dibuka lagi dan smooth
  // scroll tetap terhenti.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handle = () => onCloseRef.current()
    dialog.addEventListener('close', handle)
    return () => dialog.removeEventListener('close', handle)
  }, [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const lenis = getLenis()
    lenis?.stop()
    return () => lenis?.start()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      // Esc ditangani sendiri (bukan pembatalan bawaan peramban) agar state React
      // langsung jadi sumber kebenaran; effect di atas yang memanggil close().
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onClose()
        }
      }}
      // Klik pada area dialog di luar panel = klik backdrop
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal__panel">
        <button type="button" className="modal__close" onClick={onClose}>
          <Icon name="close" size={22} label="Tutup" />
        </button>
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  )
}
