import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import EmailTokenBanner from '../../components/tokenBanner'

const navItem = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-sm ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/60'
  }`

export default function AdminLayout() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex">
      <EmailTokenBanner />
      <aside className="w-60 bg-slate-900 text-slate-100 p-4 flex flex-col">
        <Link to="/admin" className="text-lg font-semibold mb-6">
          ISP Admin
        </Link>
        <nav className="space-y-1 flex-1">
          <NavLink to="/admin" end className={navItem}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/customers" className={navItem}>
            Pelanggan
          </NavLink>
          <NavLink to="/admin/packages" className={navItem}>
            Paket
          </NavLink>
          <NavLink to="/admin/invoices" className={navItem}>
            Tagihan
          </NavLink>
          <NavLink to="/admin/payments" className={navItem}>
            Pembayaran
          </NavLink>
          {auth?.type === 'admin' && auth.role === 'superadmin' && (
            <NavLink to="/admin/audit-log" className={navItem}>
              Audit Log
            </NavLink>
          )}
        </nav>
        <div className="border-t border-slate-800 pt-3 mt-3 space-y-1">
          {auth?.type === 'admin' && (
            <div className="px-3 py-1 text-xs text-slate-400">
              {auth.email} · <span className="capitalize">{auth.role}</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60"
          >
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}
