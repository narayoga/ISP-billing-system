// Turunan gambar untuk performa (RENCANA Fase 9). Jalankan ulang bila sumber diganti:
//   npm run images
// - Logo PNG 1240px (~96 KB) → WebP setinggi 192px (3× tampilan terbesar, footer 64px).
// - Ilustrasi hero → varian 560w untuk srcset (ponsel & layar 1×).
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const pub = fileURLToPath(new URL('../public', import.meta.url))

for (const name of ['logo-hitam', 'logo-putih']) {
  const info = await sharp(`${pub}/brand/${name}.png`)
    .resize({ height: 192 })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${pub}/brand/${name}.webp`)
  console.log(`brand/${name}.webp  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(1)} KB`)
}

for (const name of ['hero-kota', 'cs-agent']) {
  const info = await sharp(`${pub}/images/${name}.webp`)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${pub}/images/${name}-560.webp`)
  console.log(`images/${name}-560.webp  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(1)} KB`)
}
