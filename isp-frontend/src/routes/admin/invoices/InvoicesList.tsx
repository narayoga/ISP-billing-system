import { useState } from 'react'
import { api, billingApi, ApiError } from '../../../lib/api'
import { useFetch } from '../../../lib/useFetch'
import { useAuth } from '../../../lib/auth'
import type { Invoice } from '../../../lib/types'
import { INVOICE_STATUS, formatDate, formatIDR } from '../../../lib/format'
import {
  Badge,
  Button,
  Card,
  ErrorBox,
  Loading,
  Notice,
  PageHeader,
  Select,
  type Tone,
} from '../../../components/ui'

export default function InvoicesList() {
  const { auth } = useAuth()
  const isSuper = auth?.type === 'admin' && auth.role === 'superadmin'
  const [status, setStatus] = useState('')
  const path = status ? `/invoices?status=${status}` : '/invoices'
  const { data, error, loading, reload } = useFetch<Invoice[]>(path)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null)

  // US-10: kirim ulang tautan tagihan. Token yang ada diperpanjang, bukan diganti,
  // sehingga tautan pada pesan lama tetap berfungsi.
  async function resendLink(invoiceId: number) {
    setBusy(true)
    setMsg(null)
    try {
      await api(`/invoices/${invoiceId}/resend-link`, { method: 'POST' })
      setMsg({ tone: 'success', text: 'Tautan tagihan dikirim ulang ke pelanggan.' })
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof ApiError ? `Gagal kirim ulang (${e.message}).` : 'Gagal kirim ulang.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function generate() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await billingApi<{ period: string; created: number; skipped: number }>(
        '/billing/generate',
        { method: 'POST', body: JSON.stringify({}) },
      )
      // 0 tagihan baru bukan kegagalan, tapi juga bukan hasil yang diharapkan
      // admin saat menekan tombol — beri warna kuning supaya tidak terlewat.
      setMsg({
        tone: res.created > 0 ? 'success' : 'warning',
        text: `Generate ${res.period}: ${res.created} tagihan baru, ${res.skipped} dilewati.`,
      })
      reload()
    } catch (e) {
      setMsg({
        tone: 'error',
        text: e instanceof ApiError ? `Gagal generate (${e.message}).` : 'Gagal generate.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Tagihan"
        subtitle="Daftar tagihan seluruh pelanggan."
        action={
          isSuper ? (
            <Button onClick={generate} disabled={busy}>
              {busy ? 'Memproses…' : 'Generate Tagihan Massal'}
            </Button>
          ) : undefined
        }
      />
      {msg && (
        <Notice tone={msg.tone} className="mb-4">
          {msg.text}
        </Notice>
      )}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-slate-500">Filter status:</span>
        <div className="w-56">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua</option>
            <option value="unpaid">Unpaid</option>
            <option value="awaiting_verification">Menunggu Verifikasi</option>
            <option value="paid">Lunas</option>
            <option value="overdue">Overdue</option>
          </Select>
        </div>
      </div>
      {loading && <Loading />}
      {error && <ErrorBox>Gagal memuat tagihan ({error}).</ErrorBox>}
      {data && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Pelanggan</th>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                <th className="px-4 py-3 font-medium">Jatuh Tempo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Belum ada tagihan.
                  </td>
                </tr>
              )}
              {data.map((inv) => {
                const st = INVOICE_STATUS[inv.status]
                return (
                  <tr key={inv.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {inv.customer_name ?? `#${inv.customer_id}`}
                    </td>
                    <td className="px-4 py-3">{inv.period}</td>
                    <td className="px-4 py-3">{formatIDR(inv.amount)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3">
                      <Badge color={st.color}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => resendLink(inv.id)}
                      >
                        Kirim Ulang Tautan
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
