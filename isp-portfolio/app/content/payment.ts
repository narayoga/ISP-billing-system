import type { VaBank } from './types'

// Panduan bayar Virtual Account per bank (cara utama, selaras sistem billing v4:
// nomor VA tetap per pelanggan per bank, nominal = total tagihan, lunas otomatis).
// Transfer manual + konfirmasi WhatsApp tetap ada sebagai alternatif (site.payment).

export const vaNotes: string[] = [
  'Nomor Virtual Account tercantum di tagihan yang kami kirim lewat WhatsApp/email setiap bulan.',
  'Nomor VA Anda tetap — bisa disimpan sebagai daftar transfer favorit.',
  'Nominal otomatis sesuai total tagihan, jadi tidak bisa kurang atau lebih.',
  'Pembayaran tercatat otomatis: tanpa kirim bukti, layanan yang terisolir aktif kembali dalam beberapa menit.',
]

export const vaBanks: VaBank[] = [
  {
    id: 'bca',
    name: 'BCA',
    channels: [
      {
        name: 'BCA mobile (m-BCA)',
        steps: [
          'Buka BCA mobile, pilih m-BCA lalu masukkan kode akses.',
          'Pilih m-Transfer → BCA Virtual Account.',
          'Masukkan nomor Virtual Account dari tagihan Anda.',
          'Periksa nama pelanggan dan nominal, lalu pilih OK.',
          'Masukkan PIN m-BCA untuk menyelesaikan pembayaran.',
        ],
      },
      {
        name: 'ATM BCA',
        steps: [
          'Masukkan kartu dan PIN ATM.',
          'Pilih Transaksi Lainnya → Transfer → ke Rek BCA Virtual Account.',
          'Masukkan nomor Virtual Account, lalu pilih Benar.',
          'Periksa nama dan nominal, lalu pilih Ya.',
        ],
      },
      {
        name: 'KlikBCA',
        steps: [
          'Masuk ke KlikBCA Individual.',
          'Pilih Transfer Dana → Transfer ke BCA Virtual Account.',
          'Masukkan nomor Virtual Account, lalu Lanjutkan.',
          'Masukkan respon KeyBCA Appli 1, lalu Kirim.',
        ],
      },
    ],
  },
  {
    id: 'bni',
    name: 'BNI',
    channels: [
      {
        name: 'BNI Mobile Banking (wondr)',
        steps: [
          'Masuk ke aplikasi BNI Mobile Banking.',
          'Pilih Transfer → Virtual Account Billing.',
          'Masukkan nomor Virtual Account, lalu Lanjut.',
          'Periksa detail tagihan, lalu masukkan password transaksi.',
        ],
      },
      {
        name: 'ATM BNI',
        steps: [
          'Masukkan kartu dan PIN ATM.',
          'Pilih Menu Lain → Transfer → Virtual Account Billing.',
          'Masukkan nomor Virtual Account, lalu Benar.',
          'Periksa detail tagihan, lalu pilih Ya.',
        ],
      },
      {
        name: 'BNI Internet Banking',
        steps: [
          'Masuk ke BNI Internet Banking.',
          'Pilih Transfer → Virtual Account Billing.',
          'Masukkan nomor Virtual Account, lalu Lanjut.',
          'Masukkan kode otentikasi token untuk menyelesaikan.',
        ],
      },
    ],
  },
  {
    id: 'bri',
    name: 'BRI',
    channels: [
      {
        name: 'BRImo',
        steps: [
          'Masuk ke aplikasi BRImo.',
          'Pilih BRIVA, lalu masukkan nomor Virtual Account.',
          'Periksa nama dan nominal tagihan.',
          'Masukkan PIN untuk menyelesaikan pembayaran.',
        ],
      },
      {
        name: 'ATM BRI',
        steps: [
          'Masukkan kartu dan PIN ATM.',
          'Pilih Transaksi Lain → Pembayaran → Lainnya → BRIVA.',
          'Masukkan nomor Virtual Account, lalu Benar.',
          'Periksa detail tagihan, lalu pilih Ya.',
        ],
      },
      {
        name: 'Internet Banking BRI',
        steps: [
          'Masuk ke Internet Banking BRI.',
          'Pilih Pembayaran → BRIVA.',
          'Masukkan nomor Virtual Account dan nominal yang tertera.',
          'Masukkan password dan mToken, lalu Kirim.',
        ],
      },
    ],
  },
  {
    id: 'mandiri',
    name: 'Mandiri',
    channels: [
      {
        name: "Livin' by Mandiri",
        steps: [
          "Masuk ke aplikasi Livin' by Mandiri.",
          'Pilih Bayar → E-Commerce, lalu cari penyedia "Xendit".',
          'Masukkan nomor Virtual Account, lalu Lanjutkan.',
          'Periksa detail tagihan, lalu masukkan PIN.',
        ],
      },
      {
        name: 'ATM Mandiri',
        steps: [
          'Masukkan kartu dan PIN ATM.',
          'Pilih Bayar/Beli → Lainnya → Multi Payment.',
          'Masukkan kode perusahaan yang tertera di tagihan, lalu nomor Virtual Account.',
          'Periksa detail tagihan, pilih 1, lalu Ya.',
        ],
      },
    ],
  },
  {
    id: 'permata',
    name: 'Permata',
    channels: [
      {
        name: 'PermataMobile X',
        steps: [
          'Masuk ke aplikasi PermataMobile X.',
          'Pilih Bayar Tagihan → Virtual Account.',
          'Masukkan nomor Virtual Account, lalu Lanjut.',
          'Periksa detail tagihan, lalu masukkan kode otentikasi.',
        ],
      },
      {
        name: 'ATM Permata / ATM Bersama',
        steps: [
          'Masukkan kartu dan PIN ATM.',
          'Pilih Transaksi Lainnya → Pembayaran → Pembayaran Lainnya → Virtual Account.',
          'Masukkan nomor Virtual Account, lalu Benar.',
          'Periksa detail tagihan, lalu pilih Ya.',
        ],
      },
    ],
  },
]
