import {
  ArrowRight,
  Building2,
  ChartLine,
  CircleAlert,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Gauge,
  Headset,
  House,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { siWhatsapp } from 'simple-icons'
import type { IconName } from '../content/types'

// Ikon di-bundle sebagai SVG inline saat build — tanpa font ikon/CDN pihak ketiga.
const LUCIDE: Record<Exclude<IconName, 'whatsapp'>, LucideIcon> = {
  home: House,
  building: Building2,
  wifi: Wifi,
  speed: Gauge,
  shield: ShieldCheck,
  chart: ChartLine,
  support: Headset,
  check: Check,
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
  clock: Clock,
  'arrow-right': ArrowRight,
  'chevron-down': ChevronDown,
  menu: Menu,
  close: X,
  search: Search,
  copy: Copy,
  alert: CircleAlert,
}

type Props = {
  name: IconName
  size?: number
  className?: string
  /** Isi bila ikon berdiri sendiri tanpa teks (mis. tombol ikon) */
  label?: string
}

export function Icon({ name, size = 20, className, label }: Props) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }

  if (name === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} {...a11y}>
        <path d={siWhatsapp.path} />
      </svg>
    )
  }

  const Lucide = LUCIDE[name]
  return <Lucide size={size} strokeWidth={2} className={className} {...a11y} />
}
