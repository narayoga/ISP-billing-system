// Turunan gambar untuk performa (RENCANA Fase 9). Jalankan ulang bila sumber diganti:
//   npm run images
// - Favicon PNG 64px (fallback peramban tanpa dukungan ikon SVG) dari brand/favicon.svg.
//   Logo utama sudah SVG (brand/balisolusindo-*.svg), tidak perlu turunan.
// - Ilustrasi hero → varian 560w untuk srcset (ponsel & layar 1×).
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pub = `${root}public`

{
  const out = await sharp(`${pub}/brand/favicon.svg`, { density: 300 }).resize(64, 64).png().toFile(`${pub}/brand/favicon.png`)
  console.log(`brand/favicon.png  ${out.width}×${out.height}  ${(out.size / 1024).toFixed(1)} KB`)
}

for (const name of ['hero-kota', 'cs-agent']) {
  const out = await sharp(`${pub}/images/${name}.webp`)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${pub}/images/${name}-560.webp`)
  console.log(`images/${name}-560.webp  ${out.width}×${out.height}  ${(out.size / 1024).toFixed(1)} KB`)
}
