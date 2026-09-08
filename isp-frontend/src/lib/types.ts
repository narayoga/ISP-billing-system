export type Package = {
  id: number
  name: string
  price: number
  speed_mbps: number
  quota_gb: number | null
  fup_mbps: number | null
  is_active: boolean
  /** Paket bertarif negosiasi: harganya diisi per pelanggan, bukan di paket. */
  is_custom_price: boolean
}

export type CustomerStatus =
  | 'pending_provisioning'
  | 'active'
  | 'overdue'
  | 'isolated'
  | 'inactive'

export type Customer = {
  id: number
  name: string
  /** Nomor WhatsApp format internasional (mis. 628123456789) — wajib sejak PRD v3.0. */
  phone: string
  /** Opsional sejak PRD v3.0 (kanal pendamping). */
  email: string | null
  address: string
  package_id: number
  /** Harga khusus pelanggan — hanya untuk paket bertarif negosiasi. */
  custom_price: number | null
  pppoe_username: string
  ip_address: string | null
  mac_address: string | null
  status: CustomerStatus
  created_at: string
  package_name?: string | null
  package_price?: number | null
  package_is_custom_price?: boolean | null
}

/** Data halaman tagihan publik (PRD v3.0) — sengaja minim data pribadi. */
export type PublicInvoiceView = {
  invoice: {
    id: number
    period: string
    amount: number
    due_date: string
    status: InvoiceStatus
  }
  customer: { name: string }
  package: {
    name: string
    speed_mbps: number
    quota_gb: number | null
    fup_mbps: number | null
  }
  history: { period: string; amount: number; status: InvoiceStatus }[]
}

export type Profile = {
  id: number
  name: string
  email: string
  address: string
  status: CustomerStatus
  pppoe_username: string
  package: {
    id: number
    name: string
    speed_mbps: number
    quota_gb: number | null
    fup_mbps: number | null
    price: number
  }
}

export type InvoiceStatus = 'unpaid' | 'awaiting_verification' | 'paid' | 'overdue'

export type Invoice = {
  id: number
  customer_id: number
  period: string
  amount: number
  due_date: string
  status: InvoiceStatus
  created_at: string
  customer_name?: string | null
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export type Payment = {
  id: number
  invoice_id: number
  proof_path: string
  uploaded_at: string
  status: PaymentStatus
  verified_by: number | null
  verified_at: string | null
  reject_reason?: string | null
}

export type NetworkState = 'online' | 'offline' | 'unknown'

export type AuditEntry = {
  id: number
  admin_id: number | null
  admin_email?: string | null
  action: string
  entity_type: string | null
  entity_id: number | null
  payload: unknown
  created_at: string
}
