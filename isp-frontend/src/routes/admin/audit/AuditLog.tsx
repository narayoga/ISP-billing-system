import { useFetch } from '../../../lib/useFetch'
import type { AuditEntry } from '../../../lib/types'
import { formatDateTime } from '../../../lib/format'
import { Card, ErrorBox, Loading, PageHeader } from '../../../components/ui'

const ACTION_LABEL: Record<string, string> = {
  admin_login: 'Login admin',
  generate_invoices: 'Generate tagihan massal',
  approve_payment: 'Approve pembayaran',
  reject_payment: 'Reject pembayaran',
  isolate_customer: 'Isolir pelanggan',
  reactivate_customer: 'Buka isolir',
  change_package: 'Perubahan paket',
  resend_magic_link: 'Kirim ulang magic link',
}

export default function AuditLog() {
  const { data, error, loading } = useFetch<AuditEntry[]>('/audit-log')

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Riwayat aksi penting (read-only)." />
      {loading && <Loading />}
      {error && <ErrorBox>Gagal memuat audit log ({error}).</ErrorBox>}
      {data && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
                <th className="px-4 py-3 font-medium">Entitas</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Belum ada entri audit.
                  </td>
                </tr>
              )}
              {data.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDateTime(a.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.admin_email ?? (a.admin_id ? `#${a.admin_id}` : 'sistem')}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {ACTION_LABEL[a.action] ?? a.action}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.entity_type ? `${a.entity_type} ${a.entity_id ?? ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs break-all">
                    {a.payload ? JSON.stringify(a.payload) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
