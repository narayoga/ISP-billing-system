// Crop foto galeri dari file mentah ke rasio campur, lalu simpan sebagai WebP.
//
//   npm run gallery
//
// Masukan : assets-source/gallery-raw/*  (foto asli dari jagonet.co.id, tidak di-commit)
// Keluaran: public/images/galeri/*.webp
//           app/content/gallery-sizes.json  (lebar/tinggi tiap foto untuk <img>)
//
// Rasio ditentukan di sini — bukan lewat CSS — agar masonry di halaman Tentang
// Kami bervariasi (potret, lanskap, persegi). Posisi crop "attention" memakai
// deteksi area paling menonjol dari sharp sehingga subjek tidak terpotong.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(root, 'assets-source/gallery-raw')
const OUT = join(root, 'public/images/galeri')
const SIZES = join(root, 'app/content/gallery-sizes.json')
const WIDTH = 900 // lebar keluaran; tinggi mengikuti rasio

/** name = nama file keluaran (tanpa ekstensi), ratio = lebar / tinggi */
const CROPS = [
  { raw: 'gallery2.jpeg', name: '01-tim-teknisi', ratio: 16 / 9 },
  { raw: 'gallery20.jpeg', name: '02-tower-bts', ratio: 2 / 3 },
  { raw: 'gallery11.jpeg', name: '03-sambung-fiber', ratio: 1 },
  { raw: 'gallery4.jpeg', name: '04-peluncuran', ratio: 4 / 3 },
  { raw: 'gallery14.jpeg', name: '05-tarik-kabel', ratio: 3 / 4 },
  { raw: 'gallery3.jpeg', name: '06-kerja-sama', ratio: 4 / 5 },
  { raw: 'gallery12.jpeg', name: '07-splicing-odp', ratio: 4 / 3 },
  { raw: 'gallery19.jpeg', name: '08-cek-odp', ratio: 3 / 4 },
  { raw: 'gallery9.jpeg', name: '09-gathering', ratio: 16 / 9 },
  { raw: 'gallery17.jpeg', name: '10-survei-jalur', ratio: 1 },
  { raw: 'gallery1.jpg', name: '11-penghargaan', ratio: 4 / 3 },
  { raw: 'gallery8.jpg', name: '12-rapat-koordinasi', ratio: 4 / 5 },
]

await mkdir(OUT, { recursive: true })
const sizes = {}

for (const c of CROPS) {
  const height = Math.round(WIDTH / c.ratio)
  const file = join(OUT, `${c.name}.webp`)
  const info = await sharp(join(RAW, c.raw))
    .rotate() // hormati orientasi EXIF sebelum crop
    .resize(WIDTH, height, { fit: 'cover', position: sharp.strategy.attention })
    .webp({ quality: 78 })
    .toFile(file)
  sizes[c.name] = { width: info.width, height: info.height }
  console.log(`${c.raw.padEnd(16)} → ${c.name}.webp  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`)
}

await writeFile(SIZES, JSON.stringify(sizes, null, 2) + '\n')
console.log(`\n${CROPS.length} foto → ${OUT}`)
