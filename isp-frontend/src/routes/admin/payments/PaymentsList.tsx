import { useState } from 'react'
import { api, apiBlob, ApiError } from '../../../lib/api'
import { useFetch } from '../../../lib/useFetch'
import { formatDateTime, formatIDR } from '../../../lib/format'
import { Button, Card, ErrorBox, Loading, PageHeader } from '../../../components/ui'

type PendingPayment = {
  id: number
  invoice_id: number
  uploaded_at: string
  invoice_period: string
  amount: number
  customer_id: number
  customer_name: string
}

export default function PaymentsList() {
  const { data, error, loading, reload } = useFetch<PendingPayment[]>('/payments')
  const [viewer, setViewer] = useState<{ url: string; type: string } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  async function viewProof(id: number) {
    setMsg(null)
    try {
      setViewer(await apiBlob(`/payments/${id}/proof`))
    } catch {
      setMsg('Gagal memuat bukti.')
    }
  }

  function closeViewer() {
    if (viewer) URL.revokeObjectURL(viewer.url)
    setViewer(null)
  }

  async function approve(id: number) {
    setBusyId(id)
    setMsg(null)
    try {
      await api(`/payments/${id}/approve`, { method: 'POST' })
      setMsg('Pembayaran disetujui.')
      reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? `Gagal approve (${e.message}).` : 'Gagal approve.')
    } finally {
      setBusyId(null)
    }
  }

  async function reject(id: number) {
    const reason = window.prompt('Alasan penolakan (dikirim ke pelanggan):')
    if (reason == null) return
    if (reason.trim() === '') {
      setMsg('Alasan penolakan wajib diisi.')
      return
    }
    setBusyId(id)
    setMsg(null)
    try {
      await api(`/payments/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) })
      setMsg('Pembayaran ditolak, notifikasi dikirim ke pelanggan.')
      reload()
    } catch (e) {
      setMsg(e instanceof ApiError ? `Gagal reject (${e.message}).` : 'Gagal reject.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Verifikasi Pembayaran" subtitle="Bukti transfer menunggu persetujuan." />
      {msg && (
        <div className="mb-4 text-sm text-slate-700 bg-slate-100 px-3 py-2 rounded-lg">{msg}</div>
      )}
      {loading && <Loading />}
      {error && <ErrorBox>Gagal memuat ({error}).</ErrorBox>}
      {data && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Pelanggan</th>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                <th className="px-4 py-3 font-medium">Diunggah</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Tidak ada pembayaran menunggu verifikasi.
                  </td>
                </tr>
              )}
              {data.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.customer_name}</td>
                  <td className="px-4 py-3">{p.invoice_period}</td>
                  <td className="px-4 py-3">{formatIDR(p.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(p.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" onClick={() => viewProof(p.id)}>
                        Lihat Bukti
                      </Button>
                      <Button onClick={() => approve(p.id)} disabled={busyId === p.id}>
                        Approve
                      </Button>
                      <Button variant="danger" onClick={() => reject(p.id)} disabled={busyId === p.id}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {viewer && <ProofModal viewer={viewer} onClose={closeViewer} />}
    </div>
  )
}

function ProofModal({
  viewer,
  onClose,
}: {
  viewer: { url: string; type: string }
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-4 max-w-3xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">Bukti Transfer</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            ✕
          </button>
        </div>
        {viewer.type.includes('pdf') ? (
          <iframe src={viewer.url} className="w-full h-[70vh]" title="Bukti PDF" />
        ) : (
          <img src={viewer.url} alt="Bukti transfer" className="max-w-full mx-auto" />
        )}
      </div>
    </div>
  )
}
