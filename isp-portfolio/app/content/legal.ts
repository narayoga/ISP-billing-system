import type { LegalDoc } from './types'

// TODO(konten): teks final dari pemilik bisnis / penasihat hukum.
export const terms: LegalDoc = {
  title: 'Syarat & Ketentuan',
  updatedAt: '2026-11-01',
  sections: [
    {
      heading: 'Layanan',
      paragraphs: ['Syarat dan ketentuan lengkap layanan JITU akan dicantumkan di sini.'],
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
        'Pada versi ini, formulir di situs JITU belum mengirim maupun menyimpan data apa pun. Data yang Anda isi hanya berada di peramban Anda dan hilang saat halaman ditutup.',
        'Situs ini tidak memasang cookie.',
      ],
    },
  ],
}
