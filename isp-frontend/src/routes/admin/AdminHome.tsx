import { Link } from 'react-router-dom'
import { useFetch } from '../../lib/useFetch'
import { Card, ErrorBox, Loading } from '../../components/ui'

type Stats = {
  active_customers: number
  isolated_customers: number
  unpaid_invoices: number
  pending_payments: number
}

export default function AdminHome() {
  const { data, error, loading } = useFetch<Stats>('/stats')

  const cards: { label: string; value: number | string; to?: string }[] = [
    { label: 'Pelanggan Aktif', value: data?.active_customers ?? '—', to: '/admin/customers' },
    { label: 'Tagihan Belum Lunas', value: data?.unpaid_invoices ?? '—', to: '/admin/invoices' },
    { label: 'Pelanggan Terisolir', value: data?.isolated_customers ?? '—', to: '/admin/customers' },
    { label: 'Pembayaran Menunggu', value: data?.pending_payments ?? '—', to: '/admin/payments' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-slate-600 mb-6">Ringkasan operasional ISP.</p>

      {loading && <Loading />}
      {error && <ErrorBox>Gagal memuat ringkasan ({error}).</ErrorBox>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to ?? '#'}>
            <Card className="p-6 hover:shadow-md transition">
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className="text-3xl font-semibold text-slate-900 mt-1">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
