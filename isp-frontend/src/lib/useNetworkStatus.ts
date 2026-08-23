import { useEffect, useState } from 'react'
import { billingApi } from './api'

/**
 * Polling status koneksi dari isp-billing-service tiap `intervalMs` (default 5s,
 * PRD US-06 AC2). Mengembalikan map customerId(string) → 'online'|'offline'.
 * Customer yang tidak ada di map dianggap 'unknown'.
 */
export function useNetworkStatus(intervalMs = 5000): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true
    async function poll() {
      try {
        const data = await billingApi<Record<string, string>>('/customers/status')
        if (active) setMap(data)
      } catch {
        // Abaikan error sesaat; pertahankan map terakhir.
      }
    }
    void poll()
    const t = setInterval(() => void poll(), intervalMs)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [intervalMs])

  return map
}
