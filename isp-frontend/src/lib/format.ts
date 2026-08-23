import type { CustomerStatus, InvoiceStatus, NetworkState } from './types'

export function formatIDR(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDate(s: string | Date): string {
  return new Date(s).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(s: string | Date): string {
  return new Date(s).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type BadgeMeta = { label: string; color: 'slate' | 'green' | 'red' | 'amber' | 'blue' }

export const CUSTOMER_STATUS: Record<CustomerStatus, BadgeMeta> = {
  pending_provisioning: { label: 'Pending Provisioning', color: 'amber' },
  active: { label: 'Aktif', color: 'green' },
  overdue: { label: 'Menunggak', color: 'amber' },
  isolated: { label: 'Terisolir', color: 'red' },
  inactive: { label: 'Non-aktif', color: 'slate' },
}

export const INVOICE_STATUS: Record<InvoiceStatus, BadgeMeta> = {
  unpaid: { label: 'Unpaid', color: 'slate' },
  awaiting_verification: { label: 'Menunggu Verifikasi', color: 'blue' },
  paid: { label: 'Lunas', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
}

export const NETWORK_STATE: Record<NetworkState, BadgeMeta> = {
  online: { label: 'Online', color: 'green' },
  offline: { label: 'Offline', color: 'red' },
  unknown: { label: 'Unknown', color: 'slate' },
}
