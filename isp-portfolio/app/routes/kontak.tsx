import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ContactForm } from '../components/ContactForm'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { site } from '../content/site'
import type { IconName } from '../content/types'
import { formatPhone } from '../lib/format'
import { reveal } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { localBusinessLd } from '../lib/structured-data'
import { telLink, waLink } from '../lib/whatsapp'
import './kontak.css'

export function meta() {
  return pageMeta({
    title: 'Kontak Kami',
    description: 'Hubungi JITU — Jagonya Internet Ubud lewat WhatsApp, telepon, atau email. Alamat kantor dan jam operasional.',
    path: '/kontak',
    jsonLd: [localBusinessLd()],
  })
}

type Channel = { icon: IconName; label: string; value: string; href: string; external?: boolean }

// PRD US-03 AC 3: WA/telepon (sales & dukungan bila berbeda), email, alamat +
// tombol Google Maps (tautan, bukan embed), jam operasional, form Kirim Pesan.
export default function Kontak() {
  const { contact, address, hours, forms } = site
  const channels: Channel[] = [
    {
      icon: 'whatsapp',
      label: 'WhatsApp Sales',
      value: formatPhone(contact.whatsappSales),
      href: waLink('WEB-KONTAK'),
      external: true,
    },
    ...(contact.whatsappSupport !== contact.whatsappSales
      ? [
          {
            icon: 'support' as const,
            label: 'WhatsApp Dukungan Teknis',
            value: formatPhone(contact.whatsappSupport),
            href: waLink('WEB-KONTAK', 'Halo JITU, saya butuh bantuan teknis.', contact.whatsappSupport),
            external: true,
          },
        ]
      : []),
    { icon: 'phone', label: 'Telepon', value: formatPhone(contact.phone), href: telLink() },
    { icon: 'mail', label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
  ]

  return (
    <>
      <PageHeader title="Kontak Kami" description="Tim kami siap membantu lewat WhatsApp, telepon, maupun email." />

      <section className="section">
        <Reveal className="container contact-layout">
          <div className="contact-info">
            <div className="contact-channels">
              {channels.map((c, i) => (
                <a
                  key={c.label}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  {...reveal('fade-up', i * 80, 'contact-channel')}
                >
                  <span className="contact-channel__icon">
                    <Icon name={c.icon} size={22} />
                  </span>
                  <span>
                    <span className="contact-channel__label">{c.label}</span>
                    <span className="contact-channel__value">{c.value}</span>
                  </span>
                </a>
              ))}
            </div>

            <div {...reveal('fade-up', 320)}>
              <Card className="contact-address">
                <h2>
                  <Icon name="map-pin" size={20} /> Alamat Kantor
                </h2>
                <p>{address.office}</p>
                <Button href={address.mapsUrl} variant="secondary" size="sm" iconRight="arrow-right" external>
                  Buka di Google Maps
                </Button>
                <h2>
                  <Icon name="clock" size={20} /> Jam Operasional
                </h2>
                <p>{hours}</p>
              </Card>
            </div>
          </div>

          {forms.kontak === 'preview' && (
            <div {...reveal('slide-right', 150, 'contact-form-wrap')}>
              <Card>
                <h2 className="contact-form-wrap__title">Kirim Pesan</h2>
                <p className="contact-form-wrap__desc">Ada pertanyaan? Tuliskan di sini.</p>
                <ContactForm />
              </Card>
            </div>
          )}
        </Reveal>
      </section>

      <Section surface eyebrow="Butuh jawaban cepat?" title="Lihat Pertanyaan yang Sering Diajukan">
        <div className="contact-faq-cta">
          <Button href="/faq" iconRight="arrow-right">
            Buka FAQ
          </Button>
        </div>
      </Section>
    </>
  )
}
