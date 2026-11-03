# isp-portfolio

Landing page **JITU — Jagonya Internet Ubud** (Jagonet cabang Bali). Situs statis
hasil prerender: React 19 + TypeScript + React Router 7 (framework mode,
`ssr: false`) di atas Vite, dengan styling **CSS murni** (tanpa Tailwind).

Acuan kebutuhan: [`../PRD-isp-portfolio-versi-1.0.md`](../PRD-isp-portfolio-versi-1.0.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5174
```

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server di port 5174 (5173 dipakai `isp-frontend`) |
| `npm run build` | Build + prerender ke `build/client`, lalu `scripts/postbuild.mjs` (404.html, sitemap, robots, hash CSP) |
| `npm run preview` | Sajikan hasil build dengan Vite (port 4174) |
| `npm run preview:cf` | Sajikan hasil build **seperti Cloudflare Pages** (port 4175): header `_headers`, 404 asli, gzip — untuk uji CSP & Lighthouse |
| `npm run typecheck` | Bangkitkan type route lalu cek TypeScript |
| `npm run lint` | ESLint |
| `npm run gallery` | Crop foto galeri dari `assets-source/gallery-raw/` → `public/images/galeri/` |
| `npm run images` | Logo WebP kecil + varian hero 560w dari gambar sumber |
| `npm run og-image` | Gambar pratinjau tautan `public/og-image.jpg` (1200×630) |

## Struktur

```
app/
  root.tsx      kerangka HTML (lang="id"), meta global, smooth scroll, error boundary
  routes.ts     daftar route
  routes/       satu file per halaman (+ CSS-nya); /ui-kit = review komponen
  components/   komponen UI, masing-masing dengan file CSS sendiri
  content/      SELURUH konten situs (paket, coverage, kontak, FAQ, …) — edit di sini
  lib/          util: format Rupiah, tautan WhatsApp, SEO, scroll reveal, Lenis
  styles/       animations.css (pustaka scroll reveal)
  app.css       token warna/font (CSS variables) + reset
public/         aset statis (robots.txt, …)
  brand/        logo & favicon Jagonet (dari jagonet.co.id/assets/img/)
react-router.config.ts   ssr: false + daftar route yang di-prerender
```

Route baru: tambahkan di `app/routes.ts` **dan** di `prerender` pada
`react-router.config.ts` supaya ikut dibangun sebagai HTML statis. Sitemap,
robots.txt, dan hash CSP mengikuti otomatis.

## Panduan konten

Semua teks, harga, dan data ada di `app/content/` dan **bertipe** — isian yang
salah format membuat `npm run typecheck`/`npm run build` gagal, jadi situs rusak
tidak pernah terpublikasi. Cari `TODO(konten)` untuk nilai yang masih sementara.

| File | Isi | Catatan |
|---|---|---|
| `site.ts` | Nama, kontak (WA sales/dukungan, telepon, email), alamat + titik peta, cabang, jam buka, media sosial, profil/visi/misi, biaya instalasi, poin "Mohon Diperhatikan", rekening transfer, flag form, SEO | Nomor WA format internasional tanpa `+` (`62812…`). `openingHours` disamakan dengan `hours`. `forms.*`: `preview` = form kosmetik tampil, `hidden` = diganti tombol WhatsApp |
| `packages.ts` | Paket & harga | `price` dalam Rupiah (angka), `isCustomPrice: true` untuk "Hubungi Kami". `featured` tampil di Beranda |
| `coverage.ts` | Desa/kelurahan + status `tersedia`/`segera` + titik ODP (lat/lng) | Hanya `tersedia` yang bisa dipilih di form pendaftaran |
| `payment.ts` | Panduan bayar Virtual Account per bank & kanal | Rekening transfer manual ada di `site.payment` |
| `faq.ts` | Tanya-jawab per topik | Ikut ke JSON-LD `FAQPage` otomatis |
| `home.ts` | Slide hero, kata berganti, gambar kategori, logo mitra | Gambar hero: tambahkan varian `-560.webp` (`npm run images`) + `srcSet` |
| `gallery.ts` | Foto galeri Tentang Kami (tahun, judul, kategori) | Foto baru: taruh di `assets-source/gallery-raw/`, daftarkan di `scripts/crop-gallery.mjs`, `npm run gallery` |
| `legal.ts` | Syarat & Ketentuan, Kebijakan Privasi | Draf — perlu ditinjau pemilik bisnis |
| `sales.ts`, `features.ts`, `navigation.ts`, `stats.ts` | Daftar sales/referral, keunggulan, menu & mega menu, angka statistik | `stats` kosong = section statistik disembunyikan |

Setelah mengubah konten: `npm run typecheck && npm run build`, cek di
`npm run preview:cf`, lalu push — Cloudflare Pages membangun ulang otomatis.

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → hubungkan repo GitHub.
2. Pengaturan build:
   - Root directory: `isp-portfolio`
   - Build command: `npm run build`
   - Output directory: `build/client`
   - Environment variable: `NODE_VERSION=22` (lihat `.nvmrc`) dan
     **`VITE_SITE_URL=https://<domain-produksi>`** — tanpa ini canonical, Open Graph,
     dan sitemap memakai `http://localhost:5174` (build memberi peringatan ⚠).
     Untuk deploy preview/staging isi URL `*.pages.dev`-nya.
3. Deploy → buka URL `*.pages.dev`. Custom domains → tambahkan domain produksi.

`build/client` sudah berisi `_headers` (CSP, HSTS, dll.), `404.html` (Cloudflare
menyajikannya berstatus 404 untuk URL tak dikenal), `sitemap.xml`, `robots.txt`.

### Cek sebelum go-live

- [ ] `TODO(konten)` sudah diganti semua (`grep -rn "TODO(konten)" app`)
- [ ] `VITE_SITE_URL` = domain produksi; `/sitemap.xml` berisi domain itu
- [ ] Lighthouse mobile di URL staging: Performance & Accessibility ≥ 90, Best Practices & SEO ≥ 95
- [ ] DevTools Console tanpa pelanggaran CSP; `/sembarang` berstatus 404
- [ ] Rich Results Test Google (Beranda, Layanan, FAQ) & securityheaders.com
- [ ] Tautan WhatsApp mengarah ke nomor JITU yang benar
- [ ] Google Search Console: verifikasi domain, kirim `sitemap.xml`
