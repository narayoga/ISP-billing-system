import { useState, type FormEvent } from 'react'
import { length, phoneOrEmail, required, validate, type Validator } from '../lib/validation'
import { Button } from './Button'
import { ComingSoonModal } from './ComingSoon'
import { Field, Input, Select, Textarea } from './form/Field'

const SUBJECTS = ['Informasi Layanan', 'Pemasangan Baru', 'Gangguan', 'Tagihan', 'Lainnya'] as const

type Values = { name: string; contact: string; subject: string; message: string }
type Errors = Partial<Record<keyof Values, string>>

const RULES: Record<keyof Values, Validator[]> = {
  name: [required('Nama'), length('Nama', 3, 100)],
  contact: [required('No. WhatsApp / Email'), phoneOrEmail],
  subject: [required('Subjek')],
  message: [required('Pesan'), length('Pesan', 10, 1000)],
}

const EMPTY: Values = { name: '', contact: '', subject: '', message: '' }

function check(values: Values): Errors {
  const errors: Errors = {}
  for (const key of Object.keys(RULES) as (keyof Values)[]) {
    const err = validate(values[key], RULES[key])
    if (err) errors[key] = err
  }
  return errors
}

/**
 * Form Kirim Pesan — KOSMETIK (PRD §6C). Validasi berjalan di browser; bila lolos
 * muncul modal "Segera Hadir". Data tidak pernah dikirim maupun disimpan.
 * Input sengaja tanpa atribut `name`: tanpa JavaScript pun, menekan Kirim tidak
 * membawa isian ke URL.
 */
export function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const set = (key: keyof Values) => (value: string) => {
    const next = { ...values, [key]: value }
    setValues(next)
    // Setelah percobaan kirim pertama, galat diperbarui sambil mengetik.
    if (submitted) setErrors(check(next))
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
    const found = check(values)
    setErrors(found)
    const firstInvalid = (Object.keys(RULES) as (keyof Values)[]).find((k) => found[k])
    if (firstInvalid) {
      e.currentTarget.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus()
      return
    }
    setModalOpen(true)
  }

  return (
    <>
      <form className="contact-form" noValidate onSubmit={onSubmit}>
        <div className="contact-form__row">
          <Field label="Nama" required error={errors.name}>
            {(a11y) => (
              <Input
                {...a11y}
                data-field="name"
                autoComplete="name"
                value={values.name}
                onChange={(e) => set('name')(e.target.value)}
              />
            )}
          </Field>
          <Field label="No. WhatsApp / Email" required hint="Contoh: 0812xxxxxxx atau nama@email.com" error={errors.contact}>
            {(a11y) => (
              <Input
                {...a11y}
                data-field="contact"
                autoComplete="off"
                value={values.contact}
                onChange={(e) => set('contact')(e.target.value)}
              />
            )}
          </Field>
        </div>
        <Field label="Subjek" required error={errors.subject}>
          {(a11y) => (
            <Select {...a11y} data-field="subject" value={values.subject} onChange={(e) => set('subject')(e.target.value)}>
              <option value="">Pilih subjek…</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Pesan" required hint="10–1000 karakter." error={errors.message}>
          {(a11y) => (
            <Textarea
              {...a11y}
              data-field="message"
              maxLength={1000}
              value={values.message}
              onChange={(e) => set('message')(e.target.value)}
            />
          )}
        </Field>
        <div>
          <Button type="submit" iconRight="arrow-right">
            Kirim Pesan
          </Button>
        </div>
      </form>

      <ComingSoonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Kirim pesan online segera hadir"
        text="Pesan Anda belum dapat dikirim lewat situs. Silakan lanjutkan percakapan dengan tim kami melalui WhatsApp."
        source="WEB-KONTAK"
        // Hanya subjek yang ikut — tanpa nama, kontak, atau isi pesan (PRD §6).
        message={`Halo Balisolusindo, saya ingin bertanya tentang ${values.subject.toLowerCase() || 'layanan internet'}.`}
      />
    </>
  )
}
