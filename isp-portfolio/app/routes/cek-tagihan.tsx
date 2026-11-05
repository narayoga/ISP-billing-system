import { Badge } from '../components/Badge'
import { BillCheckForm } from '../components/BillCheckForm'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CopyButton } from '../components/CopyButton'
import { Icon } from '../components/Icon'
import { PageHeader } from '../components/PageHeader'
import { Reveal } from '../components/Reveal'
import { Section } from '../components/Section'
import { VaGuide } from '../components/VaGuide'
import { vaNotes } from '../content/payment'
import { site } from '../content/site'
import { reveal } from '../lib/reveal'
import { pageMeta } from '../lib/seo'
import { waLink } from '../lib/whatsapp'
import './cek-tagihan.css'

export function meta() {
  return pageMeta({
    title: 'Cek Tagihan',
    description: 'Cek tagihan dan cara pembayaran layanan internet JITU lewat Virtual Account atau transfer bank.',
    path: '/cek-tagihan',
  })
}

// PRD US-08. Cara Pembayaran selalu tampil (AC 5): Virtual Account sebagai cara
// utama (selaras billing v4), transfer manual + konfirmasi WhatsApp sebagai alternatif.
export default function CekTagihan() {
  const { payment, forms, contact } = site

  return (
    <>
      <PageHeader title="Cek Tagihan" description="Lihat tagihan dan cara pembayaran layanan Anda." />

      <section className="section">
        <Reveal className={`container bill-intro${forms.cekTagihan === 'preview' ? '' : ' bill-intro--single'}`}>
          {forms.cekTagihan === 'preview' && (
            // Aksi utama halaman "muncul ke depan"; daftar keunggulan memudar bersamaan
            <div {...reveal('scale-in')}>
              <Card className="bill-card">
                <h2 className="bill-card__title">Cek Tagihan Anda</h2>
                <p className="bill-card__desc">Masukkan ID pelanggan atau nomor WhatsApp yang terdaftar.</p>
                <BillCheckForm />
              </Card>
            </div>
          )}
          <div {...reveal('fade-in', 0, 'bill-notes')}>
            <h2>Bayar tagihan tanpa repot</h2>
            <ul>
              {vaNotes.map((n) => (
                <li key={n}>
                  <span className="bill-notes__icon">
                    <Icon name="check" size={16} />
                  </span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      <Section id="cara-bayar" surface eyebrow="Cara Pembayaran" title="Pilih Cara Bayar yang Paling Mudah">
        {/* Dua cara bayar naik bersamaan sebagai satu deret */}
        <Reveal className="bill-methods">
          <div {...reveal('rise')}>
            <Card className="bill-method">
              <div className="bill-method__head">
                <h3>Virtual Account</h3>
                <Badge tone="success">Disarankan</Badge>
              </div>
              <p className="bill-method__desc">Pilih bank Anda, lalu ikuti langkah sesuai aplikasi atau ATM yang dipakai.</p>
              <VaGuide />
            </Card>
          </div>

          <div {...reveal('rise')}>
            <Card className="bill-method">
              <div className="bill-method__head">
                <h3>Transfer Manual</h3>
                <Badge tone="neutral">Alternatif</Badge>
              </div>
              <p className="bill-method__desc">Perlu konfirmasi manual — status lunas diperbarui setelah dicek tim kami.</p>
              <dl className="bill-account">
                <div>
                  <dt>Bank</dt>
                  <dd>{payment.bank}</dd>
                </div>
                <div>
                  <dt>Nomor Rekening</dt>
                  <dd className="bill-account__number">
                    <span>{payment.accountNumber}</span>
                    <CopyButton text={payment.accountNumber} />
                  </dd>
                </div>
                <div>
                  <dt>Atas Nama</dt>
                  <dd>{payment.accountHolder}</dd>
                </div>
              </dl>
              <ol className="bill-steps">
                {payment.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <Button
                variant="whatsapp"
                icon="whatsapp"
                href={waLink('WEB-TAGIHAN', 'Halo JITU, saya ingin konfirmasi pembayaran tagihan.', contact.whatsappSupport)}
              >
                Konfirmasi via WhatsApp
              </Button>
            </Card>
          </div>
        </Reveal>
      </Section>
    </>
  )
}
