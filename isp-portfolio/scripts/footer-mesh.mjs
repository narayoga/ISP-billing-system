// Hiasan jaring simpul di footer (hasil generate Gemini, assets-source/images/footer-mesh.jpg,
// latar #F0F7FD) → WebP transparan: piksel yang mendekati warna latar dijadikan transparan
// sehingga menyatu dengan --color-surface apa pun, lalu 45% sisi kiri dipudarkan agar
// tidak bertabrakan dengan logo/teks. Jalankan: npm run footer-mesh
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const src = `${root}assets-source/images/footer-mesh.jpg`
const BG = [240, 247, 253]
const FADE = 0.45

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4
    const dist = Math.max(Math.abs(data[i] - BG[0]), Math.abs(data[i + 1] - BG[1]), Math.abs(data[i + 2] - BG[2]))
    const fade = Math.min(1, x / (width * FADE))
    // Derau JPEG di latar (jarak ≤ 8) dibuang penuh agar WebP tetap kecil.
    const alpha = dist <= 8 ? 0 : Math.min(255, (dist - 8) * 16)
    data[i + 3] = Math.round(alpha * fade)
  }
}

for (const [w, name] of [
  [1600, 'footer-mesh'],
  [800, 'footer-mesh-800'],
]) {
  const out = await sharp(data, { raw: info })
    .resize({ width: w })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(`${root}public/images/${name}.webp`)
  console.log(`images/${name}.webp  ${out.width}×${out.height}  ${(out.size / 1024).toFixed(1)} KB`)
}
