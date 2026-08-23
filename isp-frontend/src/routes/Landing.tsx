import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Sistem Manajemen ISP
        </h1>
        <p className="text-slate-600 mb-6">
          Pilih portal yang ingin Anda akses.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/portal"
            className="px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Portal Pelanggan
          </Link>
          <Link
            to="/admin"
            className="px-4 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition"
          >
            Dashboard Admin
          </Link>
        </div>
        <p className="mt-6 text-xs text-slate-400">Fase 0 — scaffold siap.</p>
      </div>
    </div>
  )
}
