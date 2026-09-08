import { Link } from 'react-router-dom'
import { useFetch } from '../../../lib/useFetch'
import type { Package } from '../../../lib/types'
import { formatIDR } from '../../../lib/format'
import { Badge, Button, Card, ErrorBox, Loading, PageHeader } from '../../../components/ui'

export default function PackagesList() {
  const { data, error, loading } = useFetch<Package[]>('/packages?all=true')

  return (
    <div>
      <PageHeader
        title="Paket Internet"
        subtitle="Kelola paket langganan."
        action={
          <Link to="/admin/packages/new">
            <Button>+ Paket Baru</Button>
          </Link>
        }
      />
      {loading && <Loading />}
      {error && <ErrorBox>Gagal memuat paket ({error}).</ErrorBox>}
      {data && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Kecepatan</th>
                <th className="px-4 py-3 font-medium">Kuota / FUP</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Belum ada paket.
                  </td>
                </tr>
              )}
              {data.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3">
                    {p.is_custom_price ? (
                      <Badge color="blue">Custom per pelanggan</Badge>
                    ) : (
                      formatIDR(p.price)
                    )}
                  </td>
                  <td className="px-4 py-3">{p.speed_mbps} Mbps</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.quota_gb ? `${p.quota_gb} GB` : 'Unlimited'}
                    {p.fup_mbps ? ` · FUP ${p.fup_mbps} Mbps` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_active ? <Badge color="green">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/packages/${p.id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
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
