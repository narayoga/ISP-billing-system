import { Link } from 'react-router'
import { footerLinks } from '../../content/navigation'
import { site } from '../../content/site'
import { formatPhone } from '../../lib/format'
import { telLink, waLink } from '../../lib/whatsapp'
import { Icon } from '../Icon'
import './Footer.css'

/** Footer bergaya .footer-area Jagonet: latar abu kebiruan, empat kolom. */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <img src={site.brand.logo.dark} alt={site.brand.name} width={423} height={64} loading="lazy" />
          <p>{site.brand.description}</p>
          {site.social.length > 0 && (
            <ul className="site-footer__social">
              {site.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="site-footer__heading">Hubungi Kami</h2>
          <ul className="site-footer__contact">
            <li>
              <Icon name="map-pin" size={18} />
              <a href={site.address.mapsUrl} target="_blank" rel="noopener noreferrer">
                {site.address.office}
              </a>
            </li>
            <li>
              <Icon name="whatsapp" size={18} />
              <a href={waLink('WEB-WIDGET')} target="_blank" rel="noopener noreferrer">
                {formatPhone(site.contact.whatsappSales)}
              </a>
            </li>
            <li>
              <Icon name="phone" size={18} />
              <a href={telLink()}>{formatPhone(site.contact.phone)}</a>
            </li>
            <li>
              <Icon name="mail" size={18} />
              <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
            </li>
            <li>
              <Icon name="clock" size={18} />
              <span>{site.hours}</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="site-footer__heading">Tautan Cepat</h2>
          <ul className="site-footer__links">
            {footerLinks.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="site-footer__heading">Cabang & POP</h2>
          <ul className="site-footer__branches">
            {site.branches.map((b) => (
              <li key={b.name}>
                <strong>{b.name}</strong>
                <span>{b.address}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="container">
          <p>
            © {year} {site.brand.name} — Jagonya Internet Ubud. Bagian dari Jagonet (PT Sarana Media Cemerlang).
          </p>
        </div>
      </div>
    </footer>
  )
}
