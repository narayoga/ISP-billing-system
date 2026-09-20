const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const BILLING_BASE = import.meta.env.VITE_BILLING_BASE_URL ?? 'http://localhost:8081'
const TOKEN_KEY = 'isp.auth.token'

// Jembatan ke modal PIN. api.ts bukan komponen React, jadi PinGateProvider
// mendaftarkan dirinya lewat registerPinGate saat mount.
export type PinGate = {
  // Buka modal, resolve dengan 4 digit yang diketik. Reject bila dibatalkan.
  requestPin: (opts: { invalid: boolean }) => Promise<string>
  done: () => void // tutup modal setelah request tulis berhasil
}
let pinGate: PinGate | null = null
export function registerPinGate(gate: PinGate | null) {
  pinGate = gate
}

function isMutating(method?: string): boolean {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes((method ?? 'GET').toUpperCase())
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function handle<T>(res: Response): Promise<T> {
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await res.json() : await res.text()
  if (!res.ok) {
    const message =
      (typeof body === 'object' && body && 'error' in body && String((body as { error: unknown }).error)) ||
      `request_failed_${res.status}`
    throw new ApiError(res.status, message, body)
  }
  return body as T
}

async function request<T>(base: string, path: string, init: RequestInit): Promise<T> {
  // Request tulis: minta PIN, lampirkan sebagai header, ulang bila salah.
  if (isMutating(init.method) && pinGate) {
    let invalid = false
    for (; ;) {
      const pin = await pinGate.requestPin({ invalid })
      const headers = new Headers(init.headers)
      headers.set('content-type', 'application/json')
      const token = getToken()
      if (token) headers.set('authorization', `Bearer ${token}`)
      headers.set('x-write-pin', pin)

      const res = await fetch(`${base}${path}`, { ...init, headers })

      // Server menolak PIN → getarkan modal dan minta lagi (jangan lempar error).
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        const peek: unknown = await res.clone().json().catch(() => null)
        const err =
          peek && typeof peek === 'object' && 'error' in peek
            ? String((peek as { error: unknown }).error)
            : null
        if (err === 'pin_invalid' || err === 'pin_required' || err === 'pin_locked') {
          invalid = true
          continue
        }
      }

      pinGate.done()
      return handle<T>(res)
    }
  }

  // Jalur baca (tetap seperti semula).
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  const token = getToken()
  if (token) headers.set('authorization', `Bearer ${token}`)
  const res = await fetch(`${base}${path}`, { ...init, headers })
  return handle<T>(res)
}

/** Upload multipart (FormData) ke isp-api-service. Content-Type diatur browser. */
export async function apiUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('authorization', `Bearer ${token}`)
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form, headers })
  return handle<T>(res)
}

/**
 * Unggah multipart ke endpoint PUBLIK (halaman tagihan bertoken).
 *
 * Sengaja TIDAK melampirkan token admin: akses ditentukan token pada URL, dan
 * kredensial admin tidak boleh bocor ke rute publik.
 */
export async function publicUpload<T = unknown>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: form })
  return handle<T>(res)
}

/** Ambil file (mis. bukti transfer) sebagai object URL — untuk ditampilkan di viewer. */
export async function apiBlob(path: string): Promise<{ url: string; type: string }> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('authorization', `Bearer ${token}`)
  const res = await fetch(`${API_BASE}${path}`, { headers })
  if (!res.ok) throw new ApiError(res.status, `request_failed_${res.status}`, null)
  const blob = await res.blob()
  return { url: URL.createObjectURL(blob), type: blob.type }
}

/** Panggil isp-api-service (Node, default :8080). */
export function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(API_BASE, path, init)
}

/** Panggil isp-billing-service (Go, default :8081). Token admin yang sama berlaku. */
export function billingApi<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(BILLING_BASE, path, init)
}
