import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export default function CustomerLayout() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/portal/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/portal" className="text-lg font-semibold text-slate-900">
            Portal Pelanggan
          </Link>
          <div className="flex items-center gap-4">
            {auth && (
              <span className="text-sm text-slate-500 hidden sm:inline">
                {auth.email}
              </span>
            )}
            <button
              onClick={onLogout}
              className="text-sm text-slate-700 hover:text-slate-900"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
