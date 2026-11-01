import type { Site } from './types'

// Identitas & konfigurasi situs. Nilai bertanda TODO(konten) masih sementara
// dan wajib diganti data JITU sebelum go-live (RENCANA.md, pertanyaan terbuka).
export const site: Site = {
  brand: {
    name: 'JITU',
    legalName: 'Jagonya Internet Ubud — Jagonet',
    tagline: 'Internet Fiber Optic untuk Ubud dan Sekitarnya',
    description:
      'JITU (Jagonya Internet Ubud) menghadirkan koneksi internet fiber optic yang berkualitas guna membantu memenuhi kebutuhan rumah dan bisnis Anda di Ubud.',
    logo: { dark: '/brand/logo-hitam.png', light: '/brand/logo-putih.png' },
  },
  contact: {
    whatsappSales: '620000000000', // TODO(konten): nomor WA sales JITU
    whatsappSupport: '620000000000', // TODO(konten): nomor WA support JITU
    phone: '620000000000', // TODO(konten)
    email: 'halo@jitu.example', // TODO(konten)
  },
  address: {
    office: 'Ubud, Kabupaten Gianyar, Bali', // TODO(konten): alamat lengkap kantor
    mapsUrl: 'https://maps.google.com/?q=Ubud,+Gianyar,+Bali', // TODO(konten)
  },
  branches: [{ name: 'JITU Ubud', address: 'Ubud, Kabupaten Gianyar, Bali' }], // TODO(konten)
  hours: 'Senin–Sabtu, 08.00–17.00 WITA · Dukungan teknis 24/7', // TODO(konten)
  social: [], // TODO(konten): tautan media sosial
  profile: {
    // Diadaptasi dari profil Jagonet (PT Sarana Media Cemerlang).
    about:
      'JITU adalah layanan internet Jagonet untuk wilayah Ubud, Bali. Bersama PT Sarana Media Cemerlang, kami mengembangkan layanan sambungan internet yang dapat disesuaikan dengan kebutuhan, situasi, dan kondisi pengguna — dari rumah tinggal hingga usaha pariwisata.',
    vision: 'Menjadi penyedia internet pilihan utama masyarakat dan pelaku usaha di Ubud.', // TODO(konten)
    mission: [
      'Menyediakan koneksi fiber optic yang stabil dengan harga transparan.',
      'Memberikan dukungan teknis yang cepat dan dekat dengan pelanggan.',
      'Memperluas jangkauan jaringan ke seluruh desa di Ubud.',
    ], // TODO(konten)
  },
  fees: { installation: 0, taxNote: 'Harga sudah termasuk PPN 11%.' }, // TODO(konten)
  terms: [
    'Harga sudah termasuk PPN 11%.',
    'Modem/ONT dipinjamkan selama berlangganan dan wajib dikembalikan saat berhenti.',
    'Biaya tambahan kabel berlaku untuk jarak instalasi lebih dari 150 meter.',
    'Pembatalan setelah survei dikenakan biaya survei.',
    'Pemutusan sebelum masa kontrak berakhir dikenakan penalti.',
  ], // TODO(konten)
  payment: {
    bank: 'BCA',
    accountNumber: '5440281',
    accountHolder: 'JITU',
    steps: [
      'Transfer sesuai nominal tagihan ke rekening di atas.',
      'Simpan bukti transfer.',
      'Kirim bukti melalui WhatsApp dengan menyertakan ID pelanggan Anda.',
    ],
  },
  forms: { daftar: 'preview', cekTagihan: 'preview', kontak: 'preview' },
  seo: {
    defaultTitle: 'JITU — Jagonya Internet Ubud',
    description:
      'Internet fiber optic unlimited tanpa FUP untuk rumah dan bisnis di Ubud, Bali. Cek coverage dan pilih paket JITU.',
    keywords: ['internet ubud', 'wifi ubud', 'internet gianyar', 'fiber optic bali', 'jagonet bali'],
  },
}
