// Membuat public/og-image.jpg (1200×630) untuk pratinjau tautan di WhatsApp,
// Facebook, X, dsb.: foto hero + lapisan gelap + logo putih + tagline.
// Jalankan: npm run og-image (hasilnya di-commit, tidak dibuat ulang saat build).
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const W = 1200
const H = 630

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#262a37" stop-opacity="0.94"/>
      <stop offset="0.65" stop-color="#262a37" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#262a37" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ed2775"/>
      <stop offset="1" stop-color="#ff7448"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect x="80" y="${H - 18}" width="${W - 160}" height="6" rx="3" fill="url(#brand)"/>
  <g font-family="Segoe UI, Roboto, Arial, sans-serif" fill="#ffffff">
    <text x="80" y="330" font-size="64" font-weight="700">Internet Fiber Optic</text>
    <text x="80" y="408" font-size="64" font-weight="700">untuk Ubud &amp; Sekitarnya</text>
    <text x="80" y="470" font-size="30" fill-opacity="0.85">Unlimited tanpa FUP · Rumah &amp; Bisnis · Dukungan 24/7</text>
  </g>
</svg>`)

const logo = await sharp(`${root}public/brand/logo-light.webp`).resize({ height: 96 }).toBuffer()

await sharp(`${root}public/images/hero-kota.webp`)
  .resize(W, H, { fit: 'cover', position: 'attention' })
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: logo, top: 90, left: 80 },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(`${root}public/og-image.jpg`)

console.log('public/og-image.jpg dibuat')
