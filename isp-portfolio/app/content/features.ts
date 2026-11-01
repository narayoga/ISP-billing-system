import type { Feature } from './types'

// Keunggulan dari jagonet.co.id/layanan-internet.html.
export const features: Feature[] = [
  {
    icon: 'speed',
    title: 'Ultra-speed Connection',
    description: 'Rasio download dan upload terbaik — hingga 1:1 untuk semua kebutuhan internet Anda.',
    tone: 'purple',
  },
  {
    icon: 'shield',
    title: 'SLA 99,50%',
    description: 'Jaminan uptime kelas dunia dengan jalur cadangan yang saling melindungi antar-BTS.',
    tone: 'primary',
  },
  {
    icon: 'chart',
    title: 'MRTG Monitoring',
    description: 'Pemantauan trafik secara nyata untuk memastikan akses internet terdistribusi dengan baik.',
    tone: 'blue',
  },
  {
    icon: 'support',
    title: 'Fast Support 24/7',
    description: 'Tim NOC dan teknisi yang andal dan berpengalaman siap membantu 7 × 24 jam.',
    tone: 'orange',
  },
]
