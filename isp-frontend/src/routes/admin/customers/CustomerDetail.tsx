import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, billingApi, ApiError } from '../../../lib/api'
import { useFetch } from '../../../lib/useFetch'
import { useAuth } from '../../../lib/auth'
import type { Customer } from '../../../lib/types'
import { CUSTOMER_STATUS, formatDate, formatIDR } from '../../../lib/format'
import {
  Badge,
  Button,
  Card,
  ErrorBox,
  Loading,
  Notice,
  PageHeader,
  type Tone,
} from '../../../components/ui'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { data: c, error, loading, reload } = useFetch<Customer>(id ? `/customers/${id}` : null)
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function doAction(fn: () => Promise<unknown>, okMsg: string) {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setMsg({ tone: 'success', text: okMsg })
      reload()
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof ApiError ? `Gagal: ${e.message}` : 'Gagal.',
      })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading />
  if (error || !c) return <ErrorBox>Pelanggan tidak ditemukan.</ErrorBox>

  const st = CUSTOMER_STATUS[c.status]
  const isSuper = auth?.type === 'admin' && auth.role === 'superadmin'

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={c.name}
        subtitle={c.email ?? undefined}
        action={
          <Link to={`/admin/customers/${c.id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
        }
      />
      {msg && (
        <Notice tone={msg.tone} className="mb-4">
          {msg.text}
        </Notice>
      )}
      <Card className="p-6 space-y-3">
        <Row label="Status">
          <Badge color={st.color}>{st.label}</Badge>
        </Row>
        <Row label="WhatsApp">{c.phone}</Row>
        <Row label="Email">{c.email ?? "—"}</Row>
        <Row label="Paket">{c.package_name ?? '—'}</Row>
        <Row label="Harga">
          {c.custom_price != null ? (
            <>
              {formatIDR(c.custom_price)}{' '}
              <span className="text-slate-400">· harga custom</span>
            </>
          ) : c.package_price != null ? (
            formatIDR(c.package_price)
          ) : (
            '—'
          )}
        </Row>
        <Row label="Alamat">{c.address}</Row>
        <Row label="PPPoE">{c.pppoe_username}</Row>
        <Row label="IP / MAC">
          {(c.ip_address ?? '—') + ' / ' + (c.mac_address ?? '—')}
        </Row>
        <Row label="Terdaftar">{formatDate(c.created_at)}</Row>
      </Card>

      <div className="flex flex-wrap gap-2 mt-4">
        {c.status !== 'inactive' ? (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() =>
              doAction(
                () => api(`/customers/${c.id}/deactivate`, { method: 'POST' }),
                'Pelanggan dinonaktifkan.',
              )
            }
          >
            Nonaktifkan
          </Button>
        ) : (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              doAction(
                () => api(`/customers/${c.id}/reactivate`, { method: 'POST' }),
                'Pelanggan diaktifkan.',
              )
            }
          >
            Aktifkan Kembali
          </Button>
        )}
        {isSuper && (c.status === 'active' || c.status === 'overdue') && (
          <Button
            variant="danger"
            disabled={busy}
            onClick={() =>
              doAction(
                () => billingApi(`/billing/customers/${c.id}/isolate`, { method: 'POST' }),
                'Pelanggan diisolir (PPPoE dimatikan).',
              )
            }
          >
            Isolir Jaringan
          </Button>
        )}
        {isSuper && c.status === 'isolated' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              doAction(
                () => billingApi(`/billing/customers/${c.id}/reactivate`, { method: 'POST' }),
                'Isolir dibuka (PPPoE diaktifkan).',
              )
            }
          >
            Buka Isolir
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/admin/customers')}>
          ← Daftar
        </Button>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-32 text-sm text-slate-500 shrink-0">{label}</div>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  )
}
