import { waLink, type WaSource } from '../lib/whatsapp'
import { Button } from './Button'
import { Icon } from './Icon'
import { IconBox } from './IconBox'
import { Modal } from './Modal'
import './ComingSoon.css'

type WaProps = {
  source: WaSource
  /** Pesan WA awal — tanpa data pribadi dari form (PRD §6) */
  message?: string
}

/** Banner di atas form kosmetik (PRD §6 Prinsip Umum). */
export function ComingSoonNotice({ source, message }: WaProps) {
  return (
    <div className="coming-soon-notice" role="note">
      <Icon name="clock" size={22} className="coming-soon-notice__icon" />
      <p>
        <strong>Fitur ini segera hadir.</strong> Untuk saat ini, silakan hubungi kami melalui WhatsApp.
      </p>
      <Button variant="whatsapp" size="sm" icon="whatsapp" href={waLink(source, message)}>
        WhatsApp
      </Button>
    </div>
  )
}

type ModalProps = WaProps & {
  open: boolean
  onClose: () => void
  title: string
  text: string
}

/** Modal "Segera Hadir" setelah validasi form lolos — data tidak dikirim ke mana pun. */
export function ComingSoonModal({ open, onClose, title, text, source, message }: ModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <IconBox icon="clock" tone="primary" />
      <p>{text}</p>
      <Button variant="whatsapp" icon="whatsapp" href={waLink(source, message)}>
        Lanjut via WhatsApp
      </Button>
    </Modal>
  )
}
