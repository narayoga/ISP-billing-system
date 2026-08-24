import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { ReactNode } from 'react'

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Memuat…
    </div>
  )
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { auth, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Loading />
  if (!auth || auth.type !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
