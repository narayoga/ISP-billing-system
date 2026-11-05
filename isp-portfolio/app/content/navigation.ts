import type { NavItem, NavLink } from './types'

// Menu utama (PRD §3 Navigasi Global). Item dengan `mega` membuka mega menu
// gaya CMS-portfolio di desktop dan menjadi akordeon di ponsel.
// Tanpa item "Beranda": logo di header sudah menautkan ke halaman utama.
export const mainNav: NavItem[] = [
  {
    label: 'Tentang Kami',
    mega: {
      title: 'Tentang JITU',
      subtitle: 'Jagonya Internet Ubud — layanan internet Jagonet yang dekat dengan Anda.',
      icon: 'wifi',
      tone: 'primary',
      cta: { label: 'Kenali kami', to: '/tentang' },
      links: [
        { label: 'Profil Perusahaan', to: '/tentang', description: 'Siapa kami dan bagaimana kami melayani', icon: 'building' },
        { label: 'Visi & Misi', to: '/tentang#visi-misi', description: 'Komitmen kami untuk Ubud', icon: 'shield' },
        { label: 'Cabang & POP', to: '/tentang#cabang', description: 'Lokasi kantor dan titik jaringan', icon: 'map-pin' },
      ],
    },
  },
  {
    label: 'Layanan',
    mega: {
      title: 'Layanan Internet',
      subtitle: 'Fiber optic unlimited tanpa FUP untuk rumah dan bisnis.',
      icon: 'speed',
      tone: 'purple',
      cta: { label: 'Lihat semua paket', to: '/layanan' },
      layout: 'rows',
      links: [
        {
          label: 'Internet Rumah',
          to: '/layanan#rumah',
          description: 'JaberNITE LITE — fiber unlimited untuk keluarga, mulai Rp175.500/bulan',
          icon: 'home',
          theme: 'lite',
        },
        {
          label: 'Internet Bisnis',
          to: '/layanan#bisnis',
          description: 'JaberNITE HOME — dedicated 1:1, SLA 99,50%, Fixed IP',
          icon: 'building',
          theme: 'home',
        },
      ],
    },
  },
  { label: 'Cek Coverage', to: '/coverage' },
  { label: 'Cek Tagihan', to: '/cek-tagihan' },
  { label: 'Kontak', to: '/kontak' },
]

export const footerLinks: NavLink[] = [
  { label: 'Layanan & Paket', to: '/layanan' },
  { label: 'Cek Coverage', to: '/coverage' },
  { label: 'Cek Tagihan', to: '/cek-tagihan' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Syarat & Ketentuan', to: '/syarat-ketentuan' },
  { label: 'Kebijakan Privasi', to: '/kebijakan-privasi' },
]
