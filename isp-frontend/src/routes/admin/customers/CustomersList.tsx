import { Link } from 'react-router-dom'
import { useFetch } from '../../../lib/useFetch'
import { useNetworkStatus } from '../../../lib/useNetworkStatus'
import type { Customer } from '../../../lib/types'
import { CUSTOMER_STATUS, formatIDR } from '../../../lib/format'
import { Badge, Button, Card, ErrorBox, Loading, PageHeader } from '../../../components/ui'

export default function CustomersList() {
  const { data, error, loading } = useFetch<Customer[]>('/customers')
  const netStatus = useNetworkStatus()

  return (
    <div>
      <PageHeader
        title="Pelanggan"
        subtitle="Kelola data pelanggan & provisioning."
        action={
          <Link to="/admin/customers/new">
            <Button>+ Pelanggan Baru</Button>
          </Link>
        }
      />
      {loading && <Loading />}
      {error && <ErrorBox>Gagal memuat pelanggan ({error}).</ErrorBox>}
      {data && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Paket</th>
                <th className="px-4 py-3 font-medium">Tagihan / bln</th>
                <th className="px-4 py-3 font-medium">PPPoE</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Koneksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                    Belum ada pelanggan.
                  </td>
                </tr>
              )}
              {data.map((c) => {
                const st = CUSTOMER_STATUS[c.status]
                return (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <Link to={`/admin/customers/${c.id}`} className="hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c.package_name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{monthlyAmount(c)}</td>
                    <td className="px-4 py-3 text-slate-600">{c.pppoe_username}</td>
                    <td className="px-4 py-3">
                      <Badge color={st.color}>{st.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ConnectionDot state={netStatus[String(c.id)]} />
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

/** Nominal yang akan ditagih: harga custom pelanggan bila ada, jika tidak harga paket. */
function monthlyAmount(c: Customer): string {
  const amount = c.custom_price ?? c.package_price
  return amount != null ? formatIDR(amount) : '—'
}

function ConnectionDot({ state }: { state: string | undefined }) {
  const color =
    state === 'online' ? 'bg-green-500' : state === 'offline' ? 'bg-red-500' : 'bg-slate-300'
  const label = state === 'online' ? 'Online' : state === 'offline' ? 'Offline' : 'Unknown'
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-slate-600">{label}</span>
    </span>
  )
}
