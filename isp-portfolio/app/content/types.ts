// Tipe seluruh konten situs. Data yang tidak sesuai tipe membuat build gagal,
// sehingga konten rusak tidak pernah terpublikasi (PRD US-09 AC 2).

export type FormMode = 'preview' | 'hidden'

export type Branch = {
  name: string
  address: string
  phone?: string
}

export type Site = {
  brand: {
    name: string
    legalName: string
    tagline: string
    description: string
    logo: { dark: string; light: string }
  }
  contact: {
    /** Nomor format internasional tanpa "+", mis. 6281234567890 */
    whatsappSales: string
    whatsappSupport: string
    phone: string
    email: string
  }
  address: { office: string; mapsUrl: string }
  branches: Branch[]
  hours: string
  social: { label: string; url: string }[]
  profile: { about: string; vision: string; mission: string[] }
  fees: { installation: number; taxNote: string }
  /** Poin "Mohon Diperhatikan" pada form pendaftaran */
  terms: string[]
  payment: { bank: string; accountNumber: string; accountHolder: string; steps: string[] }
  forms: { daftar: FormMode; cekTagihan: FormMode; kontak: FormMode }
  seo: { defaultTitle: string; description: string; keywords: string[] }
}

export type PackageCategory = {
  slug: string
  title: string
  description: string
  icon: IconName
}

export type Package = {
  slug: string
  name: string
  /** slug kategori */
  category: string
  downloadMbps: number | null
  uploadMbps: number | null
  /** Harga bulanan dalam Rupiah; diabaikan bila isCustomPrice */
  price: number
  isCustomPrice: boolean
  badge?: string
  featured?: boolean
  features: string[]
  note?: string
}

export type CoverageStatus = 'tersedia' | 'segera'

export type CoverageArea = {
  id: string
  province: string
  city: string
  /** kecamatan */
  district: string
  /** desa/kelurahan */
  village: string
  status: CoverageStatus
}

export type Feature = {
  icon: IconName
  title: string
  description: string
  /** Gradien kartu ikon, mengikuti variasi warna Jagonet */
  tone: 'primary' | 'purple' | 'blue' | 'orange'
}

export type Stat = { label: string; value: number; suffix?: string }

export type FaqItem = { topic: string; question: string; answer: string }

export type SalesPerson = { id: string; name: string }

export type LegalDoc = {
  title: string
  updatedAt: string
  sections: { heading: string; paragraphs: string[] }[]
}

export type NavLink = {
  label: string
  to: string
  description?: string
  icon?: IconName
}

export type MegaMenu = {
  title: string
  subtitle: string
  icon: IconName
  tone: Feature['tone']
  cta: NavLink
  links: NavLink[]
}

/** Item menu utama: tautan biasa, atau pemicu mega menu */
export type NavItem = { label: string; to: string; mega?: undefined } | { label: string; mega: MegaMenu; to?: undefined }

export type IconName =
  | 'home'
  | 'building'
  | 'wifi'
  | 'speed'
  | 'shield'
  | 'chart'
  | 'support'
  | 'check'
  | 'whatsapp'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'clock'
  | 'arrow-right'
  | 'chevron-down'
  | 'menu'
  | 'close'
  | 'search'
  | 'copy'
