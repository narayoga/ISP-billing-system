import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken } from './api'

export type AdminAuth = {
  type: 'admin'
  sub: number
  email: string
  role: 'superadmin' | 'cs'
}
// PRD v3.0: hanya admin yang memiliki akun & sesi login.
export type Auth = AdminAuth

type Ctx = {
  auth: Auth | null
  ready: boolean
  loginAdmin: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Auth | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!getToken()) {
        setReady(true)
        return
      }
      try {
        const res = await api<{ auth: Auth }>('/auth/me')
        if (!cancelled) setAuth(res.auth)
      } catch {
        if (!cancelled) {
          setToken(null)
          setAuth(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const res = await api<{
      token: string
      user: { id: number; email: string; role: 'superadmin' | 'cs' }
    }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(res.token)
    setAuth({
      type: 'admin',
      sub: res.user.id,
      email: res.user.email,
      role: res.user.role,
    })
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setAuth(null)
  }, [])

  const value = useMemo<Ctx>(
    () => ({ auth, ready, loginAdmin, logout }),
    [auth, ready, loginAdmin, logout],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): Ctx {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
