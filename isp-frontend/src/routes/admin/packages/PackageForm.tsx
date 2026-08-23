import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../../../lib/api'
import type { Package } from '../../../lib/types'
import { Button, Card, ErrorBox, Field, Loading, PageHeader, TextInput } from '../../../components/ui'

export default function PackageForm() {
  const { id } = useParams()
  const editing = id != null
  const navigate = useNavigate()
  const [loading, setLoading] = useState(editing)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    price: '',
    speed_mbps: '',
    quota_gb: '',
    fup_mbps: '',
    is_active: true,
  })

  useEffect(() => {
    if (!editing) return
    api<Package>(`/packages/${id}`)
      .then((p) =>
        setForm({
          name: p.name,
          price: String(p.price),
          speed_mbps: String(p.speed_mbps),
          quota_gb: p.quota_gb != null ? String(p.quota_gb) : '',
          fup_mbps: p.fup_mbps != null ? String(p.fup_mbps) : '',
          is_active: p.is_active,
        }),
      )
      .catch(() => setError('Gagal memuat paket.'))
      .finally(() => setLoading(false))
  }, [editing, id])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const payload = {
      name: form.name,
      price: Number(form.price),
      speed_mbps: Number(form.speed_mbps),
      quota_gb: form.quota_gb === '' ? null : Number(form.quota_gb),
      fup_mbps: form.fup_mbps === '' ? null : Number(form.fup_mbps),
      is_active: form.is_active,
    }
    try {
      if (editing) {
        await api(`/packages/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      } else {
        await api('/packages', { method: 'POST', body: JSON.stringify(payload) })
      }
      navigate('/admin/packages')
    } catch (err) {
      setError(err instanceof ApiError ? `Gagal menyimpan (${err.message}).` : 'Gagal menyimpan.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-xl">
      <PageHeader title={editing ? 'Edit Paket' : 'Paket Baru'} />
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && <ErrorBox>{error}</ErrorBox>}
          <Field label="Nama paket">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Harga bulanan (IDR)">
            <TextInput
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </Field>
          <Field label="Kecepatan (Mbps)">
            <TextInput
              type="number"
              min={1}
              required
              value={form.speed_mbps}
              onChange={(e) => setForm({ ...form, speed_mbps: e.target.value })}
            />
          </Field>
          <Field label="Kuota (GB)" hint="Kosongkan untuk unlimited.">
            <TextInput
              type="number"
              min={1}
              value={form.quota_gb}
              onChange={(e) => setForm({ ...form, quota_gb: e.target.value })}
            />
          </Field>
          <Field label="FUP (Mbps)" hint="Kecepatan setelah kuota habis. Opsional.">
            <TextInput
              type="number"
              min={1}
              value={form.fup_mbps}
              onChange={(e) => setForm({ ...form, fup_mbps: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Paket aktif
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/packages')}>
              Batal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
