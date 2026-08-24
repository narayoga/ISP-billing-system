import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../../../lib/api'
import type { Customer, Package } from '../../../lib/types'
import {
  Button,
  Card,
  ErrorBox,
  Field,
  Loading,
  PageHeader,
  Select,
  Textarea,
  TextInput,
} from '../../../components/ui'

const empty = {
  name: '',
  phone: '',
  email: '',
  address: '',
  package_id: '',
  pppoe_username: '',
  ip_address: '',
  mac_address: '',
}

export default function CustomerForm() {
  const { id } = useParams()
  const editing = id != null
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [packages, setPackages] = useState<Package[]>([])
  const [form, setForm] = useState(empty)

  useEffect(() => {
    async function load() {
      try {
        const pkgs = await api<Package[]>('/packages')
        setPackages(pkgs)
        if (editing) {
          const c = await api<Customer>(`/customers/${id}`)
          setForm({
            name: c.name,
            phone: c.phone,
            email: c.email ?? '',
            address: c.address,
            package_id: String(c.package_id),
            pppoe_username: c.pppoe_username,
            ip_address: c.ip_address ?? '',
            mac_address: c.mac_address ?? '',
          })
        }
      } catch {
        setError('Gagal memuat data.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [editing, id])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      address: form.address,
      package_id: Number(form.package_id),
      pppoe_username: form.pppoe_username,
      ip_address: form.ip_address || null,
      mac_address: form.mac_address || null,
    }
    try {
      if (editing) {
        await api(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        navigate(`/admin/customers/${id}`)
      } else {
        const c = await api<Customer>('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        navigate(`/admin/customers/${c.id}`)
      }
    } catch (err) {
      const m =
        err instanceof ApiError
          ? err.message === 'validation_failed'
            ? 'Periksa isian: nomor WhatsApp atau email tidak valid.'
            : err.message === 'email_taken'
            ? 'Email sudah dipakai pelanggan lain.'
            : err.message === 'pppoe_taken'
              ? 'PPPoE username sudah dipakai.'
              : err.message === 'package_not_found'
                ? 'Paket tidak ditemukan.'
                : `Gagal menyimpan (${err.message}).`
          : 'Gagal menyimpan.'
      setError(m)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-xl">
      <PageHeader
        title={editing ? 'Edit Pelanggan' : 'Pelanggan Baru'}
        subtitle={editing ? undefined : 'Tautan tagihan dikirim otomatis saat tagihan terbit.'}
      />
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBox>{error}</ErrorBox>}
          <Field label="Nama">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field
            label="Nomor WhatsApp"
            hint="Kanal notifikasi utama. Boleh ditulis 08xx — otomatis diubah ke 62xx."
          >
            <TextInput
              required
              placeholder="0812-3456-789"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Email" hint="Opsional — kanal pendamping.">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Alamat">
            <Textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Paket Internet">
            <Select
              required
              value={form.package_id}
              onChange={(e) => setForm({ ...form, package_id: e.target.value })}
            >
              <option value="" disabled>
                Pilih paket…
              </option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="PPPoE username">
            <TextInput
              required
              value={form.pppoe_username}
              onChange={(e) => setForm({ ...form, pppoe_username: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="IP Address" hint="Opsional">
              <TextInput
                placeholder="192.168.1.10"
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
              />
            </Field>
            <Field label="MAC Address" hint="Opsional">
              <TextInput
                placeholder="AA:BB:CC:DD:EE:FF"
                value={form.mac_address}
                onChange={(e) => setForm({ ...form, mac_address: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/customers')}>
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
