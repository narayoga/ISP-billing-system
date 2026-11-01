import sizes from './gallery-sizes.json'
import type { GalleryItem } from './types'

// Galeri Tentang Kami (masonry). Foto dari jagonet.co.id, di-crop oleh
// `npm run gallery` (scripts/crop-gallery.mjs) — ukuran diambil dari gallery-sizes.json.
// Tahun & judul masih perkiraan (kosmetik), akan diganti pemilik bisnis.

type Name = keyof typeof sizes

const photo = (name: Name, year: number, title: string, category: string): GalleryItem => ({
  src: `/images/galeri/${name}.webp`,
  ...sizes[name],
  alt: title,
  year,
  title,
  category,
})

export const gallery: GalleryItem[] = [
  photo('01-tim-teknisi', 2025, 'Tim Teknisi Siap Melayani', 'Kegiatan Tim'),
  photo('02-tower-bts', 2025, 'Perawatan Rutin Tower BTS', 'Perawatan Jaringan'),
  photo('03-sambung-fiber', 2024, 'Penyambungan Kabel Fiber Optic', 'Instalasi Jaringan'),
  photo('04-peluncuran', 2024, 'Peluncuran Layanan JaberNITE', 'Kegiatan Tim'),
  photo('05-tarik-kabel', 2024, 'Penarikan Kabel Backbone', 'Instalasi Jaringan'),
  photo('06-kerja-sama', 2024, 'Penandatanganan Kerja Sama Mitra', 'Kerja Sama'),
  photo('07-splicing-odp', 2025, 'Splicing di Titik Distribusi (ODP)', 'Instalasi Jaringan'),
  photo('08-cek-odp', 2025, 'Pengecekan ODP di Tiang', 'Perawatan Jaringan'),
  photo('09-gathering', 2023, 'Gathering Tahunan Keluarga Jagonet', 'Kegiatan Tim'),
  photo('10-survei-jalur', 2024, 'Survei Jalur Kabel ke Desa', 'Survei Lokasi'),
  photo('11-penghargaan', 2023, 'Penghargaan Mitra Terbaik', 'Kerja Sama'),
  photo('12-rapat-koordinasi', 2025, 'Rapat Koordinasi Tim Lapangan', 'Kegiatan Tim'),
]
