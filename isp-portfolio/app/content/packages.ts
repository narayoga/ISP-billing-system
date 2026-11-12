import type { Package, PackageCategory } from './types'

// Sementara memakai paket JaberNITE Jagonet (jagonet.co.id/layanan-internet.html,
// diamati 1 Nov 2026). TODO(konten): sesuaikan dengan paket & harga Balisolusindo di Bali.

export const categories: PackageCategory[] = [
  {
    slug: 'rumah',
    title: 'Internet Rumah',
    description: 'Paket JaberNITE fiber optic untuk kebutuhan keluarga, belajar, dan hiburan.',
    icon: 'home',
  },
  {
    slug: 'bisnis',
    title: 'Internet Bisnis',
    description: 'Dedicated internet 1:1 untuk kantor, villa, hotel, dan usaha pariwisata.',
    icon: 'building',
  },
]

const homeFeatures = (mbps: number) => [
  '100% Fiber Optic',
  'Unlimited Akses',
  `Download Speed Up To ${mbps} Mbps`,
  `Upload Speed Up To ${mbps} Mbps`,
  '24/7 Support',
  'NO FUP',
]

export const packages: Package[] = [
  {
    slug: 'jagoan-10',
    name: 'Jagoan 10',
    category: 'rumah',
    downloadMbps: 10,
    uploadMbps: 10,
    price: 175_500,
    isCustomPrice: false,
    featured: true,
    features: homeFeatures(10),
  },
  {
    slug: 'jagoan-15',
    name: 'Jagoan 15',
    category: 'rumah',
    downloadMbps: 15,
    uploadMbps: 15,
    price: 235_500,
    isCustomPrice: false,
    badge: 'Most Popular',
    featured: true,
    features: homeFeatures(15),
  },
  {
    slug: 'jagoan-20',
    name: 'Jagoan 20',
    category: 'rumah',
    downloadMbps: 20,
    uploadMbps: 20,
    price: 285_500,
    isCustomPrice: false,
    features: homeFeatures(20),
  },
  {
    slug: 'jagoan-25',
    name: 'Jagoan 25',
    category: 'rumah',
    downloadMbps: 25,
    uploadMbps: 25,
    price: 335_500,
    isCustomPrice: false,
    badge: 'Premium',
    featured: true,
    features: [...homeFeatures(25), 'Modem Support 5 GHz (dipinjamkan)'],
  },
  {
    slug: 'jitunet-bisnis',
    name: 'JituNet Bisnis',
    category: 'bisnis',
    downloadMbps: null,
    uploadMbps: null,
    price: 0,
    isCustomPrice: true,
    features: [
      'Dedicated bandwidth 1:1',
      'SLA 99,50%',
      'Fixed IP',
      'MRTG Monitoring',
      'Dukungan NOC 24/7',
    ],
    note: 'Kecepatan dan harga disesuaikan kebutuhan usaha Anda.',
  },
]
