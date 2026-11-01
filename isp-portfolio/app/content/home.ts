import { waLink } from '../lib/whatsapp'
import type { HeroSlide, Partner, Step } from './types'

// Konten khusus Beranda. Gambar dari jagonet.co.id/assets/img (dikonversi ke WebP).
// TODO(konten): sesuaikan teks slide bersama pemilik bisnis (RENCANA.md no. 9).

export const heroSlides: HeroSlide[] = [
  {
    id: 'solusi',
    eyebrow: 'Jagonya Internet Ubud',
    title: 'Solusi Tepat Kebutuhan Internet Anda di Ubud',
    text: 'Koneksi fiber optic Jagonet yang stabil untuk rumah, villa, dan usaha Anda — dipasang dan dirawat oleh tim lokal.',
    image: { src: '/images/hero-kota.webp', width: 1100, height: 1012, alt: 'Ilustrasi jaringan internet kota' },
    primary: { label: 'Berlangganan', href: '/daftar' },
    secondary: { label: 'Cek Coverage', href: '/coverage' },
  },
  {
    id: 'unlimited',
    eyebrow: 'Paket JaberNITE',
    title: 'Unlimited Tanpa FUP, Mulai Rp175.500/bulan',
    text: '100% fiber optic dengan kecepatan upload sama dengan download. Kecepatan tidak diturunkan walau pemakaian tinggi.',
    image: { src: '/images/speedometer.webp', width: 480, height: 480, alt: 'Ilustrasi speedometer kecepatan internet' },
    primary: { label: 'Lihat Paket', href: '/layanan' },
    secondary: { label: 'Bandingkan Harga', href: '/layanan#rumah' },
  },
  {
    id: 'dukungan',
    eyebrow: 'Fast Support 24/7',
    title: 'Ada Kendala? Tim Kami Siap Membantu',
    text: 'NOC dan teknisi JITU siaga 7 × 24 jam. Hubungi kami lewat WhatsApp kapan saja.',
    image: { src: '/images/support.webp', width: 128, height: 128, alt: 'Ilustrasi petugas layanan pelanggan' },
    primary: { label: 'Chat WhatsApp', href: waLink('WEB-HERO'), icon: 'whatsapp' },
    secondary: { label: 'Kontak Kami', href: '/kontak' },
  },
]

/** Kata yang berganti pada headline section Keunggulan (AnimatedWord CMS-portfolio). */
export const headlineWords = ['Cepat', 'Stabil', 'Unlimited', 'Terjangkau']

export const categoryImages: Record<string, { src: string; width: number; height: number }> = {
  rumah: { src: '/images/wifi.webp', width: 320, height: 320 },
  bisnis: { src: '/images/server.webp', width: 128, height: 128 },
}

export const steps: Step[] = [
  { icon: 'search', title: 'Cek Coverage', description: 'Pastikan jaringan JITU sudah tersedia di desa Anda.' },
  { icon: 'whatsapp', title: 'Isi Formulir / Hubungi Kami', description: 'Daftar online atau chat tim kami lewat WhatsApp.' },
  { icon: 'map-pin', title: 'Survei & Instalasi', description: 'Teknisi datang untuk survei lokasi dan pemasangan.' },
  { icon: 'wifi', title: 'Internet Aktif', description: 'Nikmati internet fiber optic unlimited tanpa FUP.' },
]

/** Section Partner hanya tampil bila diisi (PRD §3 #8). TODO(konten) */
export const partners: Partner[] = []
