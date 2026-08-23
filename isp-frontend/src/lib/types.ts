export type Package = {
  id: number
  name: string
  price: number
  speed_mbps: number
  quota_gb: number | null
  fup_mbps: number | null
  is_active: boolean
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
  email: string
  address: string
  package_id: number
  pppoe_username: string
  ip_address: string | null
  mac_address: string | null
  status: CustomerStatus
  created_at: string
  package_name?: string | null
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
