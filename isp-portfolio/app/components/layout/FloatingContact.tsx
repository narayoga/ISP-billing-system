import { telLink, waLink } from '../../lib/whatsapp'
import { Icon } from '../Icon'
import './FloatingContact.css'

/**
 * Widget WhatsApp & telepon melayang di semua halaman (PRD US-03 AC 1–2),
 * pengganti panel "Berlangganan" merah muda Jagonet. Pesan WA memakai kode
 * sumber [WEB-WIDGET].
 */
export function FloatingContact() {
  return (
    <div className="floating-contact">
      <a
        href={waLink('WEB-WIDGET')}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-contact__btn floating-contact__btn--wa"
        aria-label="Chat WhatsApp"
      >
        <Icon name="whatsapp" size={26} />
        <span className="floating-contact__label" aria-hidden="true">Chat WhatsApp</span>
      </a>
      <a href={telLink()} className="floating-contact__btn floating-contact__btn--phone" aria-label="Telepon Sales">
        <Icon name="phone" size={22} />
        <span className="floating-contact__label" aria-hidden="true">Telepon Sales</span>
      </a>
    </div>
  )
}
