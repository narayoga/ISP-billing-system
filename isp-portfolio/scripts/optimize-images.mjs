// Turunan gambar untuk performa (RENCANA Fase 9). Jalankan ulang bila sumber diganti:
//   npm run images
// - Logo Balisolusindo (assets-source/brand, PNG 1600px) → WebP setinggi 192px
//   (3× tampilan terbesar, footer 64px), tepi kosong dipangkas. Dua varian:
//   gelap (asli) untuk header solid/footer, terang (abu-abu → putih, oranye/merah
//   muda tetap) untuk header transparan di atas hero gelap.
// - Ilustrasi hero → varian 560w untuk srcset (ponsel & layar 1×).
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const pub = `${root}public`

const logo = sharp(`${root}assets-source/brand/balisolusindo-logo.png`).trim().resize({ height: 192 }).ensureAlpha()
const { data, info } = await logo.raw().toBuffer({ resolveWithObject: true })

async function writeLogo(pixels, name) {
  const out = await sharp(pixels, { raw: info }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${pub}/brand/${name}.webp`)
  console.log(`brand/${name}.webp  ${out.width}×${out.height}  ${(out.size / 1024).toFixed(1)} KB`)
}

await writeLogo(data, 'logo-dark')

// Varian terang: piksel abu-abu (saturasi rendah) dijadikan putih, alpha dipertahankan
// sehingga tepi antialias tetap halus.
const light = Buffer.from(data)
for (let i = 0; i < light.length; i += 4) {
  const [r, g, b] = [light[i], light[i + 1], light[i + 2]]
  if (Math.max(r, g, b) - Math.min(r, g, b) < 40) light.fill(255, i, i + 3)
}
await writeLogo(light, 'logo-light')

for (const name of ['hero-kota', 'cs-agent']) {
  const out = await sharp(`${pub}/images/${name}.webp`)
    .resize({ width: 560, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(`${pub}/images/${name}-560.webp`)
  console.log(`images/${name}-560.webp  ${out.width}×${out.height}  ${(out.size / 1024).toFixed(1)} KB`)
}
