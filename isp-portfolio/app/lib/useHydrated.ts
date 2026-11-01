import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * false saat prerender & saat hidrasi, true setelahnya. Dipakai untuk konten
 * yang bergantung pada URL/peramban (mis. ?q=) agar HTML hasil hidrasi tetap
 * cocok dengan HTML prerender, lalu diperbarui sesudahnya.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}
