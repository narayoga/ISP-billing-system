import { useState, type FormEvent } from 'react'
import { site } from '../content/site'
import { customerKey, customerKeyKind, required, validate } from '../lib/validation'
import { Button } from './Button'
import { ComingSoonModal } from './ComingSoon'
import { Field, Input } from './form/Field'

/** Jeda kosmetik "memeriksa", sama seperti form pendaftaran. */
const CHECK_DELAY = 700

/**
 * Form Cek Tagihan — KOSMETIK (PRD §6B, US-08). Satu isian: ID pelanggan atau
 * nomor WhatsApp, jenisnya dideteksi otomatis. Bila valid muncul modal "Segera
 * Hadir" dengan tombol WhatsApp ke CS. Tidak ada fetch maupun penyimpanan; input
 * tanpa atribut `name` agar tanpa JavaScript pun isian tidak terbawa ke URL.
 */
export function BillCheckForm() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [checking, setChecking] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const check = (v: string) => validate(v, [required('ID pelanggan / No. WhatsApp'), customerKey])
  const kind = value.trim() ? customerKeyKind(value) : null

  function onChange(v: string) {
    setValue(v)
    if (submitted) setError(check(v))
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (checking) return
    const input = e.currentTarget.querySelector<HTMLInputElement>('[data-field="key"]')
    setChecking(true)
    window.setTimeout(() => {
      setChecking(false)
      setSubmitted(true)
      const found = check(value)
      setError(found)
      if (found) input?.focus()
      else setModalOpen(true)
    }, CHECK_DELAY)
  }

  return (
    <>
      <form className="bill-form" noValidate onSubmit={onSubmit}>
        <Field
          label="ID Pelanggan atau No. WhatsApp"
          required
          hint={
            kind === 'phone'
              ? 'Terdeteksi: nomor WhatsApp terdaftar.'
              : kind === 'id'
                ? 'Terdeteksi: ID pelanggan.'
                : 'ID pelanggan tertera di tagihan bulanan, mis. JITU-00123.'
          }
          error={error ?? undefined}
        >
          {(a) => (
            <Input
              {...a}
              data-field="key"
              autoComplete="off"
              maxLength={30}
              placeholder="JITU-00123 atau 0812xxxxxxx"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" icon="search" loading={checking}>
          {checking ? 'Memeriksa…' : 'Cek Tagihan'}
        </Button>
      </form>

      <ComingSoonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cek tagihan online segera hadir"
        text="Untuk sementara, tim kami siap membantu mengecek tagihan Anda lewat WhatsApp. Siapkan ID pelanggan Anda."
        source="WEB-TAGIHAN"
        // Tanpa ID pelanggan/nomor dari form (PRD §6).
        message="Halo JITU, saya ingin mengecek tagihan internet saya."
        number={site.contact.whatsappSupport}
      />
    </>
  )
}
