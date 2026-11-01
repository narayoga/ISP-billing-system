import type { LegalDoc } from './types'

// DRAF — TODO(konten): teks final wajib ditinjau pemilik bisnis / penasihat hukum
// sebelum go-live (RENCANA.md, PRD §14 no. 12).
export const terms: LegalDoc = {
  title: 'Syarat & Ketentuan',
  updatedAt: '2026-11-01',
  sections: [
    {
      heading: 'Layanan',
      paragraphs: [
        'JITU (Jagonya Internet Ubud) menyediakan layanan akses internet berbasis fiber optic untuk pelanggan rumah dan bisnis di wilayah jangkauan kami.',
        'Kecepatan yang tercantum adalah kecepatan maksimum paket. Kecepatan aktual dapat dipengaruhi perangkat pelanggan, jaringan Wi-Fi di lokasi, dan kondisi server tujuan.',
      ],
    },
    {
      heading: 'Pendaftaran & Instalasi',
      paragraphs: [
        'Pendaftaran dianggap sah setelah data pelanggan diverifikasi dan survei lokasi menyatakan instalasi dapat dilakukan.',
        'Modem/ONT dipinjamkan selama masa berlangganan dan wajib dikembalikan dalam kondisi baik saat berhenti berlangganan.',
        'Biaya tambahan kabel berlaku untuk jarak instalasi lebih dari 150 meter dari titik jaringan terdekat.',
      ],
    },
    {
      heading: 'Tagihan & Pembayaran',
      paragraphs: [
        'Tagihan bulanan terbit setiap tanggal 1 dan jatuh tempo pada tanggal 20 bulan berjalan. Harga sudah termasuk PPN 11%.',
        'Layanan dapat dibatasi apabila tagihan belum dibayar melewati batas waktu yang ditentukan, dan dipulihkan setelah pembayaran diterima.',
      ],
    },
    {
      heading: 'Pembatalan & Penghentian',
      paragraphs: [
        'Pembatalan setelah survei lokasi dikenakan biaya survei.',
        'Pemutusan layanan sebelum masa kontrak berakhir dikenakan penalti sesuai perjanjian berlangganan.',
      ],
    },
  ],
}

export const privacy: LegalDoc = {
  title: 'Kebijakan Privasi',
  updatedAt: '2026-11-01',
  sections: [
    {
      heading: 'Data yang kami kumpulkan',
      paragraphs: [
        // PRD US-04 AC 3: nyatakan jujur bahwa form belum mengirim/menyimpan data.
        'Pada versi ini, seluruh formulir di situs JITU (pendaftaran, cek tagihan, dan kirim pesan) belum mengirim maupun menyimpan data apa pun. Data yang Anda isi hanya berada di peramban Anda dan hilang saat halaman ditutup atau dimuat ulang.',
        'Foto KTP dan tanda tangan pada formulir pendaftaran hanya ditampilkan sebagai pratinjau di perangkat Anda dan tidak diunggah.',
      ],
    },
    {
      heading: 'Cookie & pelacakan',
      paragraphs: ['Situs ini tidak memasang cookie dan tidak memuat skrip pelacak pihak ketiga.'],
    },
    {
      heading: 'Komunikasi melalui WhatsApp',
      paragraphs: [
        'Saat Anda menekan tombol WhatsApp, aplikasi WhatsApp terbuka dengan pesan awal berisi kode sumber halaman (mis. [WEB-PAKET]) untuk membantu tim kami memahami asal pertanyaan. Pesan tersebut tidak berisi data pribadi dari formulir.',
        'Percakapan selanjutnya tunduk pada kebijakan privasi WhatsApp.',
      ],
    },
    {
      heading: 'Perubahan kebijakan',
      paragraphs: [
        'Kebijakan ini akan diperbarui sebelum formulir online diaktifkan, termasuk tata cara pengelolaan data pribadi sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.',
      ],
    },
  ],
}
