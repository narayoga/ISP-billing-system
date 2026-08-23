import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { ApiError } from '../../lib/api'

export default function CustomerLogin() {
  const { loginCustomer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await loginCustomer(email, password)
      const from = (location.state as { from?: string } | null)?.from ?? '/portal'
      navigate(from === '/portal/login' ? '/portal' : from, { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? 'Email atau password salah'
          : err instanceof ApiError && err.status === 403
            ? 'Akun tidak aktif. Hubungi admin.'
            : 'Login gagal — coba lagi.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 p-8 space-y-4"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Portal Pelanggan</h1>
          <p className="text-sm text-slate-500">Masuk untuk lihat tagihan & layanan.</p>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <label className="block">
          <span className="text-sm text-slate-700">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="username"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Memproses…' : 'Masuk'}
        </button>
        <p className="text-xs text-slate-500 text-center">
          Baru pertama kali? Cek email Anda untuk magic link onboarding.
        </p>
      </form>
    </div>
  )
}
