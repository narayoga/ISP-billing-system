import { useState, type FormEvent } from 'react'
import { apiUpload, ApiError } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import type { Invoice, Profile } from '../../lib/types'
import { CUSTOMER_STATUS, INVOICE_STATUS, formatDate, formatIDR } from '../../lib/format'
import { Badge, Button, Card, ErrorBox, Loading } from '../../components/ui'

export default function CustomerHome() {
  const profileQ = useFetch<Profile>('/me/profile')
  const invoicesQ = useFetch<Invoice[]>('/me/invoices')

  if (profileQ.loading || invoicesQ.loading) return <Loading />
  if (profileQ.error || !profileQ.data) return <ErrorBox>Gagal memuat data akun.</ErrorBox>

  const profile = profileQ.data
  const invoices = invoicesQ.data ?? []
  const current = invoices[0] ?? null
  const history = invoices.slice(1, 4)

  function reloadAll() {
    profileQ.reload()
    invoicesQ.reload()
  }

  return (
    <div className="space-y-6">
      <Banner profile={profile} invoices={invoices} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CurrentInvoiceCard invoice={current} onUploaded={reloadAll} />
          {history.length > 0 && <HistoryCard invoices={history} />}
        </div>
        <ServiceInfoCard profile={profile} />
      </div>
    </div>
  )
}

function Banner({ profile, invoices }: { profile: Profile; invoices: Invoice[] }) {
  let cls = 'bg-blue-50 border-blue-200 text-blue-800'
  let text = 'Selamat datang di portal pelanggan.'
  if (profile.status === 'isolated') {
    cls = 'bg-red-50 border-red-200 text-red-800'
    text =
      'Layanan Anda saat ini terisolir karena tunggakan. Lakukan pembayaran dan unggah bukti untuk reaktivasi.'
  } else if (invoices.some((i) => i.status === 'awaiting_verification')) {
    cls = 'bg-blue-50 border-blue-200 text-blue-800'
    text = 'Bukti pembayaran Anda sedang diverifikasi oleh admin.'
  } else if (invoices.some((i) => i.status === 'overdue')) {
    cls = 'bg-amber-50 border-amber-200 text-amber-800'
    text =
      'Tagihan Anda telah melewati jatuh tempo. Segera lakukan pembayaran untuk menghindari isolir.'
  } else if (invoices.some((i) => i.status === 'unpaid')) {
    cls = 'bg-amber-50 border-amber-200 text-amber-800'
    text = 'Tagihan bulan ini telah terbit. Mohon lakukan pembayaran sebelum jatuh tempo.'
  } else if (invoices.length > 0) {
    cls = 'bg-green-50 border-green-200 text-green-800'
    text = 'Semua tagihan Anda lunas. Terima kasih!'
  }
  return <div className={`border rounded-xl px-4 py-3 text-sm ${cls}`}>{text}</div>
}

function CurrentInvoiceCard({
  invoice,
  onUploaded,
}: {
  invoice: Invoice | null
  onUploaded: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (!invoice) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Tagihan</h2>
        <p className="text-slate-500 text-sm">Belum ada tagihan untuk akun Anda.</p>
      </Card>
    )
  }

  const st = INVOICE_STATUS[invoice.status]
  const canUpload = invoice.status === 'unpaid' || invoice.status === 'overdue'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!file) {
      setError('Pilih file bukti transfer dulu.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File terlalu besar (maks 2MB).')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('proof', file)
      await apiUpload(`/me/invoices/${invoice!.id}/proof`, form)
      setDone(true)
      onUploaded()
    } catch (err) {
      const m =
        err instanceof ApiError
          ? err.message === 'file_too_large'
            ? 'File terlalu besar (maks 2MB).'
            : err.message === 'invalid_file_type'
              ? 'Tipe file harus .jpg, .png, atau .pdf.'
              : `Gagal mengunggah (${err.message}).`
          : 'Gagal mengunggah.'
      setError(m)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tagihan {invoice.period}</h2>
          <p className="text-3xl font-semibold text-slate-900 mt-2">{formatIDR(invoice.amount)}</p>
          <p className="text-sm text-slate-500 mt-1">Jatuh tempo {formatDate(invoice.due_date)}</p>
        </div>
        <Badge color={st.color}>{st.label}</Badge>
      </div>

      {invoice.status === 'awaiting_verification' && (
        <p className="mt-4 text-sm text-blue-700">Bukti pembayaran sedang diverifikasi admin.</p>
      )}
      {invoice.status === 'paid' && (
        <p className="mt-4 text-sm text-green-700">Tagihan ini sudah lunas.</p>
      )}

      {canUpload && !done && (
        <form onSubmit={onSubmit} className="mt-5 border-t border-slate-100 pt-5 space-y-3">
          <BankInfo />
          <p className="text-sm font-medium text-slate-700">Unggah bukti transfer</p>
          {error && <ErrorBox>{error}</ErrorBox>}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white hover:file:bg-slate-800"
          />
          <p className="text-xs text-slate-400">Format .jpg / .png / .pdf, maksimal 2MB.</p>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Mengunggah…' : 'Kirim Bukti'}
          </Button>
        </form>
      )}
      {done && (
        <p className="mt-4 text-sm text-green-700">Bukti terkirim. Menunggu verifikasi admin.</p>
      )}
    </Card>
  )
}

const BANK_NAME = import.meta.env.VITE_BANK_NAME
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT
const BANK_HOLDER = import.meta.env.VITE_BANK_HOLDER

function BankInfo() {
  if (!BANK_NAME || !BANK_ACCOUNT) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      <p className="text-xs text-slate-500 mb-1">Transfer ke rekening berikut</p>
      <p className="text-sm font-semibold text-slate-900">
        {BANK_NAME} — {BANK_ACCOUNT}
        {BANK_HOLDER ? ` a.n. ${BANK_HOLDER}` : ''}
      </p>
    </div>
  )
}

function HistoryCard({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Riwayat Tagihan</h2>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-left">
          <tr>
            <th className="px-6 py-3 font-medium">Periode</th>
            <th className="px-6 py-3 font-medium">Nominal</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const st = INVOICE_STATUS[inv.status]
            return (
              <tr key={inv.id} className="border-t border-slate-100">
                <td className="px-6 py-3">{inv.period}</td>
                <td className="px-6 py-3">{formatIDR(inv.amount)}</td>
                <td className="px-6 py-3">
                  <Badge color={st.color}>{st.label}</Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}

function ServiceInfoCard({ profile }: { profile: Profile }) {
  const st = CUSTOMER_STATUS[profile.status]
  const pk = profile.package
  return (
    <Card className="p-6 h-fit">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Layanan Aktif</h2>
      <div className="space-y-2 text-sm">
        <InfoRow label="Paket" value={pk.name} />
        <InfoRow label="Kecepatan" value={`${pk.speed_mbps} Mbps`} />
        <InfoRow label="Kuota" value={pk.quota_gb ? `${pk.quota_gb} GB` : 'Unlimited'} />
        <InfoRow label="FUP" value={pk.fup_mbps ? `${pk.fup_mbps} Mbps` : '—'} />
        <InfoRow label="PPPoE" value={profile.pppoe_username} />
        <div className="flex justify-between pt-2">
          <span className="text-slate-500">Status</span>
          <Badge color={st.color}>{st.label}</Badge>
        </div>
      </div>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  )
}
