import { waLink, type WaSource } from '../lib/whatsapp'
import { Button } from './Button'
import { IconBox } from './IconBox'
import { Modal } from './Modal'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  text: string
  source: WaSource
  /** Pesan WA awal — tanpa data pribadi dari form (PRD §6) */
  message?: string
}

/** Modal "Segera Hadir" setelah validasi form lolos — data tidak dikirim ke mana pun. */
export function ComingSoonModal({ open, onClose, title, text, source, message }: Props) {
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
