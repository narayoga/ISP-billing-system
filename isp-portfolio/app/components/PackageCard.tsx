import type { Package } from '../content/types'
import { formatRupiah } from '../lib/format'
import { waLink } from '../lib/whatsapp'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { Icon } from './Icon'
import './PackageCard.css'

/** Kartu paket meniru ".single-app-pricing-box" Jagonet (PRD US-05 AC 2–4). */
export function PackageCard({ pkg }: { pkg: Package }) {
  const highlighted = pkg.badge === 'Most Popular'
  return (
    <Card hover highlight={highlighted} className="package-card">
      <div className="package-card__head">
        <div>
          <h3 className="package-card__name">{pkg.name}</h3>
          <p className="package-card__terms">*Syarat &amp; Ketentuan Berlaku</p>
        </div>
        {pkg.badge && <Badge>{pkg.badge}</Badge>}
      </div>

      <p className="package-card__price">
        {pkg.isCustomPrice ? (
          <span className="package-card__speed package-card__speed--text">Hubungi Kami</span>
        ) : (
          <>
            <span className="package-card__speed">
              {pkg.downloadMbps}
              <small>Mbps</small>
            </span>
            <span className="package-card__amount">/{formatRupiah(pkg.price)}/bulan</span>
          </>
        )}
      </p>
      {pkg.note && <p className="package-card__note">{pkg.note}</p>}

      {pkg.isCustomPrice ? (
        <Button
          variant="whatsapp"
          icon="whatsapp"
          href={waLink('WEB-PAKET', `Halo JITU, saya tertarik dengan paket ${pkg.name}.`)}
          className="package-card__cta"
        >
          Hubungi Kami
        </Button>
      ) : (
        <Button href={`/daftar?paket=${pkg.slug}`} className="package-card__cta">
          Berlangganan
        </Button>
      )}

      <ul className="package-card__features">
        {pkg.features.map((f) => (
          <li key={f}>
            <Icon name="check" size={18} className="package-card__check" />
            {f}
          </li>
        ))}
      </ul>
    </Card>
  )
}
