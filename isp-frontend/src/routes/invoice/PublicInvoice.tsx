import { useState, type FormEvent, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { publicUpload, ApiError } from '../../lib/api'
import { useFetch } from '../../lib/useFetch'
import type { PublicInvoiceView } from '../../lib/types'
import { INVOICE_STATUS, formatDate, formatIDR } from '../../lib/format'
import { Badge, Button, Card, ErrorBox, Loading } from '../../components/ui'

const BANK_NAME = import.meta.env.VITE_BANK_NAME
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT
const BANK_HOLDER = import.meta.env.VITE_BANK_HOLDER

/**
 * Halaman tagihan publik (PRD v3.0 US-01/US-02).
 *
 * Diakses lewat tautan bertoken yang dikirim via WhatsApp/email — TANPA login.
 * Satu token hanya membuka satu invoice.
 */
export default function PublicInvoice() {
  const { token } = useParams()
  const { data, error, loading, reload } = useFetch<PublicInvoiceView>(
    token ? `/public/invoice/${token}` : null,
  )

  if (loading) {
    return (
      <Shell>
        <Loading />
      </Shell>
    )
  }
  if (error || !data) {
    return (
      <Shell>
        <InvalidLink reason={error} />
      </Shell>
    )
  }

  const { invoice, customer, package: pkg, history } = data
  const st = INVOICE_STATUS[invoice.status]
  const canUpload = invoice.status === 'unpaid' || invoice.status === 'overdue'

  return (
    <Shell>
      <p className="text-sm text-slate-500 mb-4">
        Tagihan untuk <span className="font-medium text-slate-800">{customer.name}</span>
      </p>

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tagihan {invoice.period}</h2>
            <p className="text-3xl font-semibold text-slate-900 mt-2">{formatIDR(invoice.amount)}</p>
            <p className="text-sm text-slate-500 mt-1">
              Jatuh tempo {formatDate(invoice.due_date)}
            </p>
          </div>
          <Badge color={st.color}>{st.label}</Badge>
        </div>

        {invoice.status === 'awaiting_verification' && (
          <p className="mt-4 text-sm text-blue-700">
            Bukti pembayaran Anda sudah kami terima dan sedang diverifikasi admin.
          </p>
        )}
        {invoice.status === 'paid' && (
          <p className="mt-4 text-sm text-green-700">Tagihan ini sudah lunas. Terima kasih.</p>
        )}

        {canUpload && <UploadSection token={token!} onUploaded={reload} />}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <ServiceCard pkg={pkg} />
        {history.length > 0 && <HistoryCard history={history} />}
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Tagihan Layanan Internet</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

/** Pesan ramah saat tautan tidak berlaku (US-01 AC5). */
function InvalidLink({ reason }: { reason: string | null }) {
  const pesan =
    reason === 'token_expired'
      ? 'Tautan ini sudah kedaluwarsa.'
      : reason === 'token_revoked'
        ? 'Tautan ini sudah tidak berlaku.'
        : 'Tautan tidak ditemukan atau salah.'
  return (
    <Card className="p-8 text-center">
      <p className="text-slate-900 font-medium mb-1">{pesan}</p>
      <p className="text-slate-600 text-sm">
        Silakan hubungi admin untuk meminta tautan tagihan yang baru.
      </p>
    </Card>
  )
}

function UploadSection({ token, onUploaded }: { token: string; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

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
      await publicUpload(`/public/invoice/${token}/proof`, form)
      setDone(true)
      onUploaded()
    } catch (err) {
      const m =
        err instanceof ApiError
          ? err.message === 'file_too_large'
            ? 'File terlalu besar (maks 2MB).'
            : err.message === 'invalid_file_type'
              ? 'Tipe file harus .jpg, .png, atau .pdf.'
              : err.message === 'too_many_uploads'
                ? 'Terlalu banyak percobaan unggah. Coba lagi nanti.'
                : err.message === 'invoice_already_paid'
                  ? 'Tagihan ini sudah lunas.'
                  : 'Gagal mengunggah bukti.'
          : 'Gagal mengunggah bukti.'
      setError(m)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="mt-5 border-t border-slate-100 pt-5 text-sm text-green-700">
        Bukti pembayaran terkirim. Layanan akan diproses setelah admin memverifikasi.
      </p>
    )
  }

  return (
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
  )
}

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

function ServiceCard({ pkg }: { pkg: PublicInvoiceView['package'] }) {
  return (
    <Card className="p-6 h-fit">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Layanan Anda</h2>
      <div className="space-y-2 text-sm">
        <Row label="Paket" value={pkg.name} />
        <Row label="Kecepatan" value={`${pkg.speed_mbps} Mbps`} />
        <Row label="Kuota" value={pkg.quota_gb ? `${pkg.quota_gb} GB` : 'Unlimited'} />
        <Row label="FUP" value={pkg.fup_mbps ? `${pkg.fup_mbps} Mbps` : '—'} />
      </div>
    </Card>
  )
}

function HistoryCard({ history }: { history: PublicInvoiceView['history'] }) {
  return (
    <Card className="overflow-hidden h-fit">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Riwayat Tagihan</h2>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {history.map((h) => {
            const st = INVOICE_STATUS[h.status]
            return (
              <tr key={h.period} className="border-t border-slate-100 first:border-0">
                <td className="px-6 py-3">{h.period}</td>
                <td className="px-6 py-3">{formatIDR(h.amount)}</td>
                <td className="px-6 py-3 text-right">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  )
}
