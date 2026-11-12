import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { coverage } from '../content/coverage'
import { packages } from '../content/packages'
import { sales } from '../content/sales'
import { site } from '../content/site'
import { formatRupiah } from '../lib/format'
import { getLenis } from '../lib/useSmoothScroll'
import {
  email,
  googleMapsUrl,
  identityNumber,
  length,
  minAge,
  npwp,
  phone,
  photoError,
  postalCode,
  required,
  validate,
  voucher,
  type Validator,
} from '../lib/validation'
import { Button } from './Button'
import { Card } from './Card'
import { ComingSoonModal } from './ComingSoon'
import { Checkbox, ChoiceGroup } from './form/Choice'
import { Field, Input, Select, Textarea } from './form/Field'
import { PhotoInput } from './form/PhotoInput'
import { SignaturePad } from './form/SignaturePad'
import { Icon } from './Icon'
import './RegistrationForm.css'

// Hanya area berstatus "Tersedia" yang bisa dipilih di alamat berjenjang (US-07 AC 4).
const AREAS = coverage.filter((a) => a.status === 'tersedia')
const unique = (xs: string[]) => [...new Set(xs)]

type Text = {
  nama: string
  email: string
  hp: string
  gender: string
  tempatLahir: string
  tanggalLahir: string
  jenisId: string
  nomorId: string
  npwp: string
  provinsi: string
  kota: string
  kecamatan: string
  desa: string
  alamat: string
  kodePos: string
  mapsUrl: string
  jenisPelanggan: string
  sales: string
  paket: string
  voucher: string
}

const EMPTY: Text = {
  nama: '', email: '', hp: '', gender: '', tempatLahir: '', tanggalLahir: '', jenisId: 'KTP',
  nomorId: '', npwp: '',
  provinsi: '', kota: '', kecamatan: '', desa: '',
  alamat: '', kodePos: '', mapsUrl: '',
  jenisPelanggan: '', sales: '', paket: '', voucher: '',
}

// Isian disimpan di sessionStorage tab ini saja agar tidak hilang saat halaman
// dimuat ulang; terhapus sendiri ketika tab ditutup. Foto & tanda tangan tidak ikut.
const STORAGE_KEY = 'jitu-daftar'

/** `paket` & `area` = parameter URL saat isian disimpan, untuk mengenali prefill baru. */
type Saved = { v?: Partial<Record<keyof Text, unknown>>; setuju?: unknown; paket?: string; area?: string }

function readSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Saved) : null
  } catch {
    return null
  }
}

function initialValues(saved: Saved | null, initialPackage: string, initialArea: string): Text {
  const v = { ...EMPTY }
  for (const key of Object.keys(EMPTY) as (keyof Text)[]) {
    const x = saved?.v?.[key]
    if (typeof x === 'string') v[key] = x
  }
  // Desa tersimpan yang tidak lagi "Tersedia" → alamat berjenjang dipilih ulang.
  if (v.desa && !AREAS.some((a) => a.id === v.desa)) Object.assign(v, { provinsi: '', kota: '', kecamatan: '', desa: '' })
  // Prefill URL menang hanya bila berbeda dari saat isian disimpan (datang dari tautan lain).
  const area = AREAS.find((a) => a.id === initialArea)
  if (area && saved?.area !== initialArea) {
    Object.assign(v, { provinsi: area.province, kota: area.city, kecamatan: area.district, desa: area.id })
  }
  if (packages.some((p) => p.slug === initialPackage) && saved?.paket !== initialPackage) v.paket = initialPackage
  return v
}

/** Jeda kosmetik "memeriksa" sebelum hasil validasi tampil. */
const CHECK_DELAY = 700

type Errors = Partial<Record<keyof Text | 'fotoKtp' | 'fotoRumah' | 'setuju' | 'ttd', string>>

/** Urutan field = urutan fokus saat validasi gagal. */
const ORDER: (keyof Errors)[] = [
  'nama', 'email', 'hp', 'gender', 'tempatLahir', 'tanggalLahir', 'jenisId', 'nomorId', 'npwp',
  'fotoKtp', 'fotoRumah',
  'provinsi', 'kota', 'kecamatan', 'desa', 'alamat', 'kodePos', 'mapsUrl',
  'jenisPelanggan', 'sales', 'paket', 'voucher',
  'setuju', 'ttd',
]

function rules(v: Text): Partial<Record<keyof Text, Validator[]>> {
  return {
    nama: [required('Nama lengkap'), length('Nama lengkap', 3, 150)],
    email: [required('Email'), email],
    hp: [required('No. HP / WhatsApp'), phone],
    gender: [required('Jenis kelamin')],
    tempatLahir: [required('Tempat lahir'), length('Tempat lahir', 1, 100)],
    tanggalLahir: [required('Tanggal lahir'), minAge(17)],
    jenisId: [required('Jenis identitas')],
    nomorId: [required('Nomor identitas'), identityNumber(v.jenisId)],
    npwp: [npwp],
    provinsi: [required('Provinsi')],
    kota: [required('Kabupaten/Kota')],
    kecamatan: [required('Kecamatan')],
    desa: [required('Desa/Kelurahan')],
    alamat: [required('Alamat'), length('Alamat', 10, 255)],
    kodePos: [required('Kode pos'), postalCode],
    mapsUrl: [googleMapsUrl],
    jenisPelanggan: [required('Jenis pelanggan')],
    paket: [required('Paket layanan')],
    voucher: [voucher],
  }
}

type Props = {
  /** Prefill dari ?paket=<slug> (US-05 AC 4 / US-07 AC 8) */
  initialPackage?: string
  /** Prefill dari ?area=<id> hasil Cek Coverage (US-06 AC 2 / US-07 AC 8) */
  initialArea?: string
  /** Tanggal registrasi (hari ini) — kosong saat prerender agar HTML cocok */
  today: string
}

/**
 * Formulir Pendaftaran Berlangganan — KOSMETIK (PRD §6A, US-07).
 * Validasi lengkap di browser; bila gagal, ringkasan galat tampil di atas formulir
 * dan halaman kembali ke sana; bila lolos muncul modal "Segera Hadir" dengan
 * tombol WhatsApp. Tidak ada fetch; isian teks hanya disimpan di sessionStorage
 * tab ini; foto & tanda tangan hanya tampil di perangkat pengunjung.
 */
export function RegistrationForm({ initialPackage = '', initialArea = '', today }: Props) {
  // `today` terisi = sudah hidrasi (form dipasang ulang), baru boleh membaca sessionStorage.
  const [saved] = useState(() => (today ? readSaved() : null))
  const [v, setV] = useState<Text>(() => initialValues(saved, initialPackage, initialArea))
  const [fotoKtp, setFotoKtp] = useState<File | null>(null)
  const [fotoRumah, setFotoRumah] = useState<File | null>(null)
  const [setuju, setSetuju] = useState(saved?.setuju === true)
  const [ttd, setTtd] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [locating, setLocating] = useState<'idle' | 'busy' | 'error'>('idle')
  const [checking, setChecking] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!today) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v, setuju, paket: initialPackage, area: initialArea }))
    } catch {
      // Penyimpanan diblokir (mode privat dsb.) — formulir tetap jalan tanpa pemulihan isian.
    }
  }, [v, setuju, today, initialPackage, initialArea])

  // Setelah kirim gagal: kembali ke ringkasan galat di atas formulir.
  useEffect(() => {
    const el = summaryRef.current
    if (!attempt || !el) return
    scrollToEl(el)
    el.focus({ preventScroll: true })
  }, [attempt])

  // ── Opsi alamat berjenjang ──
  const provinces = useMemo(() => unique(AREAS.map((a) => a.province)), [])
  const cities = useMemo(() => unique(AREAS.filter((a) => a.province === v.provinsi).map((a) => a.city)), [v.provinsi])
  const districts = useMemo(
    () => unique(AREAS.filter((a) => a.province === v.provinsi && a.city === v.kota).map((a) => a.district)),
    [v.provinsi, v.kota],
  )
  const villages = useMemo(
    () => AREAS.filter((a) => a.province === v.provinsi && a.city === v.kota && a.district === v.kecamatan),
    [v.provinsi, v.kota, v.kecamatan],
  )

  const pkg = packages.find((p) => p.slug === v.paket)

  function check(next: Text, files = { fotoKtp, fotoRumah }, flags = { setuju, ttd }): Errors {
    const r = rules(next)
    const e: Errors = {}
    for (const key of Object.keys(r) as (keyof Text)[]) {
      const err = validate(next[key], r[key] ?? [])
      if (err) e[key] = err
    }
    const ktp = photoError(files.fotoKtp, 'Foto KTP', true)
    if (ktp) e.fotoKtp = ktp
    const rumah = photoError(files.fotoRumah, 'Foto rumah', false)
    if (rumah) e.fotoRumah = rumah
    if (!flags.setuju) e.setuju = 'Anda perlu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.'
    if (!flags.ttd) e.ttd = 'Tanda tangan wajib diisi.'
    return e
  }

  /** Ubah satu field; level alamat di bawahnya dikosongkan (US-07 AC 4). */
  function set<K extends keyof Text>(key: K, value: Text[K]) {
    const next = { ...v, [key]: value }
    if (key === 'provinsi') Object.assign(next, { kota: '', kecamatan: '', desa: '' })
    if (key === 'kota') Object.assign(next, { kecamatan: '', desa: '' })
    if (key === 'kecamatan') Object.assign(next, { desa: '' })
    setV(next)
    if (submitted) setErrors(check(next))
  }

  const revalidate = (patch: Partial<{ fotoKtp: File | null; fotoRumah: File | null; setuju: boolean; ttd: boolean }>) => {
    if (!submitted) return
    setErrors(
      check(v, { fotoKtp: patch.fotoKtp !== undefined ? patch.fotoKtp : fotoKtp, fotoRumah: patch.fotoRumah !== undefined ? patch.fotoRumah : fotoRumah }, {
        setuju: patch.setuju ?? setuju,
        ttd: patch.ttd ?? ttd,
      }),
    )
  }

  function fillFromLocation() {
    if (!('geolocation' in navigator)) return setLocating('error')
    setLocating('busy')
    // Koordinat diproses di perangkat saja untuk membentuk tautan Maps (PRD §6A no. 18).
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        set('mapsUrl', `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`)
        setLocating('idle')
      },
      () => setLocating('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (checking) return
    setChecking(true)
    window.setTimeout(() => {
      setChecking(false)
      setSubmitted(true)
      const found = check(v)
      setErrors(found)
      if (Object.keys(found).length > 0) setAttempt((n) => n + 1)
      else setModalOpen(true)
    }, CHECK_DELAY)
  }

  function focusField(k: keyof Errors) {
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${k}"]`)
    if (!el) return
    scrollToEl(el)
    el.focus({ preventScroll: true })
  }

  const err = (k: keyof Errors) => errors[k]
  const errorKeys = ORDER.filter((k) => errors[k])

  return (
    <>
      <form ref={formRef} className="reg-form" noValidate onSubmit={onSubmit}>
        {submitted && errorKeys.length > 0 && (
          <div ref={summaryRef} className="reg-errors" role="alert" tabIndex={-1}>
            <h2 className="reg-errors__title">
              <Icon name="alert" size={20} /> Pendaftaran belum bisa dikirim
            </h2>
            <p>Periksa {errorKeys.length} isian berikut:</p>
            <ul>
              {errorKeys.map((k) => (
                <li key={k}>
                  <button type="button" onClick={() => focusField(k)}>
                    {errors[k]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <FormSection step={1} title="Data Diri" icon="support">
          <div className="reg-grid">
            <Field label="Nama Lengkap" required hint="Sesuai kartu identitas." error={err('nama')}>
              {(a) => <Input {...a} data-field="nama" autoComplete="name" value={v.nama} onChange={(e) => set('nama', e.target.value)} />}
            </Field>
            <Field label="Email" required error={err('email')}>
              {(a) => (
                <Input {...a} data-field="email" type="email" autoComplete="email" value={v.email} onChange={(e) => set('email', e.target.value)} />
              )}
            </Field>
            <Field label="No. HP / WhatsApp" required hint="Contoh: 0812xxxxxxx" error={err('hp')}>
              {(a) => (
                <Input {...a} data-field="hp" type="tel" inputMode="tel" autoComplete="tel" value={v.hp} onChange={(e) => set('hp', e.target.value)} />
              )}
            </Field>
            <ChoiceGroup
              legend="Jenis Kelamin"
              name="gender"
              required
              options={['Laki-laki', 'Perempuan']}
              value={v.gender}
              onChange={(x) => set('gender', x)}
              error={err('gender')}
              dataField="gender"
            />
            <Field label="Tempat Lahir" required error={err('tempatLahir')}>
              {(a) => <Input {...a} data-field="tempatLahir" value={v.tempatLahir} onChange={(e) => set('tempatLahir', e.target.value)} />}
            </Field>
            <Field label="Tanggal Lahir" required hint="Usia minimal 17 tahun." error={err('tanggalLahir')}>
              {(a) => (
                <Input {...a} data-field="tanggalLahir" type="date" value={v.tanggalLahir} onChange={(e) => set('tanggalLahir', e.target.value)} />
              )}
            </Field>
            <ChoiceGroup
              legend="Jenis Identitas"
              name="jenisId"
              required
              options={['KTP', 'SIM']}
              value={v.jenisId}
              onChange={(x) => set('jenisId', x)}
              error={err('jenisId')}
              dataField="jenisId"
            />
            <Field
              label="Nomor Identitas"
              required
              hint={v.jenisId === 'SIM' ? 'Nomor SIM 12–16 digit.' : 'NIK 16 digit.'}
              error={err('nomorId')}
            >
              {(a) => (
                <Input {...a} data-field="nomorId" inputMode="numeric" autoComplete="off" value={v.nomorId} onChange={(e) => set('nomorId', e.target.value)} />
              )}
            </Field>
            <Field label="NPWP" hint="Opsional — terutama untuk pelanggan bisnis (15/16 digit)." error={err('npwp')}>
              {(a) => (
                <Input {...a} data-field="npwp" inputMode="numeric" autoComplete="off" value={v.npwp} onChange={(e) => set('npwp', e.target.value)} />
              )}
            </Field>
          </div>
        </FormSection>

        <FormSection step={2} title="Dokumen" icon="copy">
          <div className="reg-grid">
            <PhotoInput
              label="Foto KTP"
              required
              hint="JPG/PNG, maks. 2 MB. Hanya dipratinjau di perangkat Anda."
              error={err('fotoKtp')}
              dataField="fotoKtp"
              onChange={(f) => {
                setFotoKtp(f)
                revalidate({ fotoKtp: f })
              }}
            />
            <PhotoInput
              label="Foto Rumah"
              hint="Opsional — membantu tim survei menemukan lokasi."
              error={err('fotoRumah')}
              dataField="fotoRumah"
              onChange={(f) => {
                setFotoRumah(f)
                revalidate({ fotoRumah: f })
              }}
            />
          </div>
        </FormSection>

        <FormSection step={3} title="Alamat Pemasangan" icon="map-pin">
          <p className="reg-note">
            Hanya area yang sudah <strong>Tersedia</strong>. Belum yakin? <Link to="/coverage">Cek coverage</Link> dulu.
          </p>
          <div className="reg-grid">
            <Field label="Provinsi" required error={err('provinsi')}>
              {(a) => (
                <Select {...a} data-field="provinsi" value={v.provinsi} onChange={(e) => set('provinsi', e.target.value)}>
                  <option value="">Pilih provinsi…</option>
                  {provinces.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Kabupaten/Kota" required error={err('kota')}>
              {(a) => (
                <Select {...a} data-field="kota" value={v.kota} disabled={!v.provinsi} onChange={(e) => set('kota', e.target.value)}>
                  <option value="">{v.provinsi ? 'Pilih kabupaten/kota…' : 'Pilih provinsi dulu'}</option>
                  {cities.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Kecamatan" required error={err('kecamatan')}>
              {(a) => (
                <Select {...a} data-field="kecamatan" value={v.kecamatan} disabled={!v.kota} onChange={(e) => set('kecamatan', e.target.value)}>
                  <option value="">{v.kota ? 'Pilih kecamatan…' : 'Pilih kabupaten/kota dulu'}</option>
                  {districts.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Desa/Kelurahan" required error={err('desa')}>
              {(a) => (
                <Select {...a} data-field="desa" value={v.desa} disabled={!v.kecamatan} onChange={(e) => set('desa', e.target.value)}>
                  <option value="">{v.kecamatan ? 'Pilih desa/kelurahan…' : 'Pilih kecamatan dulu'}</option>
                  {villages.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.village}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="reg-grid__full">
              <Field label="Alamat (Jalan, No. Rumah, RT/RW)" required error={err('alamat')}>
                {(a) => (
                  <Textarea
                    {...a}
                    data-field="alamat"
                    rows={3}
                    maxLength={255}
                    autoComplete="street-address"
                    value={v.alamat}
                    onChange={(e) => set('alamat', e.target.value)}
                  />
                )}
              </Field>
            </div>
            <Field label="Kode Pos" required error={err('kodePos')}>
              {(a) => (
                <Input
                  {...a}
                  data-field="kodePos"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  value={v.kodePos}
                  onChange={(e) => set('kodePos', e.target.value)}
                />
              )}
            </Field>
            <Field label="Link Google Maps" hint="Opsional — atau isi otomatis dari lokasi perangkat." error={err('mapsUrl')}>
              {(a) => (
                <div className="reg-maps">
                  <Input {...a} data-field="mapsUrl" type="url" placeholder="https://maps.google.com/…" value={v.mapsUrl} onChange={(e) => set('mapsUrl', e.target.value)} />
                  <Button type="button" variant="secondary" size="sm" icon="map-pin" onClick={fillFromLocation} disabled={locating === 'busy'}>
                    {locating === 'busy' ? 'Mencari…' : 'Gunakan Lokasi Saya'}
                  </Button>
                  {locating === 'error' && <span className="reg-maps__error">Lokasi tidak dapat diakses — isi tautan secara manual.</span>}
                </div>
              )}
            </Field>
          </div>
        </FormSection>

        <FormSection step={4} title="Layanan" icon="wifi">
          <div className="reg-grid">
            <Field label="Tanggal Registrasi" hint="Terisi otomatis.">
              {(a) => <Input {...a} value={today || '—'} readOnly aria-readonly="true" className="input--readonly" />}
            </Field>
            <ChoiceGroup
              legend="Jenis Pelanggan"
              name="jenisPelanggan"
              required
              options={['Personal', 'Bisnis']}
              value={v.jenisPelanggan}
              onChange={(x) => set('jenisPelanggan', x)}
              error={err('jenisPelanggan')}
              dataField="jenisPelanggan"
            />
            <Field label="Paket Layanan" required error={err('paket')}>
              {(a) => (
                <Select {...a} data-field="paket" value={v.paket} onChange={(e) => set('paket', e.target.value)}>
                  <option value="">Pilih paket…</option>
                  {packages.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} — {p.isCustomPrice ? 'Hubungi Kami' : `${formatRupiah(p.price)}/bulan`}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Sales / Referral" hint="Opsional.">
              {(a) => (
                <Select {...a} data-field="sales" value={v.sales} onChange={(e) => set('sales', e.target.value)}>
                  <option value="">Tidak ada</option>
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Kode Voucher" hint="Opsional — huruf/angka, maks. 20 karakter." error={err('voucher')}>
              {(a) => (
                <Input {...a} data-field="voucher" maxLength={20} autoComplete="off" value={v.voucher} onChange={(e) => set('voucher', e.target.value.toUpperCase())} />
              )}
            </Field>
          </div>

          {/* Biaya otomatis (US-07 AC 5) */}
          <div className="reg-costs" aria-live="polite">
            <div>
              <span>Biaya Bulanan</span>
              <strong>{pkg ? (pkg.isCustomPrice ? 'Hubungi Kami' : formatRupiah(pkg.price)) : '—'}</strong>
            </div>
            <div>
              <span>Biaya Instalasi</span>
              <strong>{site.fees.installation > 0 ? formatRupiah(site.fees.installation) : 'Gratis'}</strong>
            </div>
            <p>{site.fees.taxNote}</p>
          </div>
        </FormSection>

        <FormSection step={5} title="Persetujuan" icon="shield">
          <div className="reg-terms" role="note">
            <h3>
              <Icon name="clock" size={18} /> Mohon Diperhatikan
            </h3>
            <ul>
              {site.terms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <Checkbox
            checked={setuju}
            onChange={(c) => {
              setSetuju(c)
              revalidate({ setuju: c })
            }}
            error={err('setuju')}
            dataField="setuju"
          >
            Saya telah membaca dan menyetujui{' '}
            <Link to="/syarat-ketentuan" target="_blank">
              Syarat &amp; Ketentuan
            </Link>{' '}
            serta{' '}
            <Link to="/kebijakan-privasi" target="_blank">
              Kebijakan Privasi
            </Link>
            . <span className="field__required">*</span>
          </Checkbox>
          <SignaturePad
            error={err('ttd')}
            dataField="ttd"
            onChange={(s) => {
              setTtd(s)
              revalidate({ ttd: s })
            }}
          />
        </FormSection>

        <div className="reg-submit">
          {/* Nonaktif sampai JavaScript siap, agar formulir tidak pernah terkirim apa adanya */}
          <Button type="submit" iconRight="arrow-right" loading={checking} disabled={!today}>
            {checking ? 'Memeriksa isian…' : 'Kirim Pendaftaran'}
          </Button>
        </div>
      </form>

      <ComingSoonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Pendaftaran online segera hadir"
        text="Data Anda belum dapat dikirim lewat situs. Lanjutkan pendaftaran bersama tim kami melalui WhatsApp — data formulir tidak ikut terkirim."
        source="WEB-DAFTAR"
        // Hanya nama paket — tanpa data pribadi dari formulir (PRD §6).
        message={`Halo Balisolusindo, saya ingin berlangganan${pkg ? ` paket ${pkg.name}` : ''}.`}
      />
    </>
  )
}

/** Scroll mulus ke elemen, menyisakan ruang untuk header tetap. */
function scrollToEl(el: HTMLElement) {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80
  // Posisi dihitung dari scrollY asli; posisi internal Lenis bisa tertinggal bila halaman di-scroll tanpa Lenis.
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - header - 24)
  const lenis = getLenis()
  if (lenis) return lenis.scrollTo(top)
  window.scrollTo({ top })
}

function FormSection({
  step,
  title,
  icon,
  children,
}: {
  step: number
  title: string
  icon: Parameters<typeof Icon>[0]['name']
  children: ReactNode
}) {
  return (
    <Card className="reg-section">
      <h2 className="reg-section__title">
        <span className="reg-section__step" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
        <span>
          <small>Langkah {step}</small>
          {title}
        </span>
      </h2>
      {children}
    </Card>
  )
}
