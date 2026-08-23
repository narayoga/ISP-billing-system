import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../lib/api'

export default function CustomerSetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <Centered>
        <p className="text-red-700">Link tidak valid (token kosong).</p>
        <Link to="/portal/login" className="text-blue-600 underline">
          Kembali ke login
        </Link>
      </Centered>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setSubmitting(true)
    try {
      await api('/auth/customer/set-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setSuccess(true)
      setTimeout(() => navigate('/portal/login', { replace: true }), 1500)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message === 'token_expired'
            ? 'Link sudah kadaluarsa. Hubungi admin untuk minta link baru.'
            : err.message === 'token_already_used'
              ? 'Link sudah pernah dipakai.'
              : err.message === 'token_not_found'
                ? 'Link tidak ditemukan.'
                : 'Gagal menyimpan password.'
          : 'Gagal menyimpan password.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Centered>
        <p className="text-green-700 font-medium">
          Password berhasil dibuat. Mengalihkan ke halaman login…
        </p>
      </Centered>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 p-8 space-y-4"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Set Password</h1>
          <p className="text-sm text-slate-500">
            Buat password untuk akun pelanggan Anda.
          </p>
        </div>
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        <label className="block">
          <span className="text-sm text-slate-700">Password baru</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700">Konfirmasi password</span>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Menyimpan…' : 'Simpan Password'}
        </button>
      </form>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div className="space-y-3">{children}</div>
    </div>
  )
}
