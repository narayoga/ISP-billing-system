import type { FaqItem } from './types'

// TODO(konten): tinjau jawaban bersama pemilik bisnis.
export const faq: FaqItem[] = [
  {
    topic: 'Layanan',
    question: 'Apakah paket JITU benar-benar unlimited?',
    answer: 'Ya. Semua paket rumah unlimited tanpa FUP, sehingga kecepatan tidak diturunkan walau pemakaian tinggi.',
  },
  {
    topic: 'Layanan',
    question: 'Apa beda paket rumah dan bisnis?',
    answer:
      'Paket rumah memakai bandwidth bersama dengan harga tetap. Paket bisnis memakai bandwidth dedicated 1:1, Fixed IP, dan SLA 99,50% dengan harga sesuai kebutuhan.',
  },
  {
    topic: 'Pemasangan',
    question: 'Bagaimana cara berlangganan?',
    answer:
      'Cek ketersediaan jaringan di lokasi Anda, isi formulir atau hubungi kami lewat WhatsApp, lalu tim kami menjadwalkan survei dan instalasi.',
  },
  {
    topic: 'Pemasangan',
    question: 'Berapa lama proses instalasi?',
    answer: 'Umumnya 1–3 hari kerja setelah survei lokasi, tergantung kondisi jaringan di area Anda.',
  },
  {
    topic: 'Tagihan',
    question: 'Kapan tagihan bulanan terbit?',
    answer: 'Tagihan terbit setiap tanggal 1 dan jatuh tempo tanggal 20. Tautan tagihan dikirim melalui WhatsApp.',
  },
  {
    topic: 'Tagihan',
    question: 'Bagaimana cara membayar tagihan?',
    answer: 'Lihat halaman Cek Tagihan untuk rekening tujuan dan langkah konfirmasi pembayaran.',
  },
]
