# Rencana Pengerjaan isp-portfolio (JITU — Jagonya Internet Ubud)

Turunan dari [`PRD-isp-portfolio-versi-1.0.md`](../PRD-isp-portfolio-versi-1.0.md)
yang dipecah menjadi fase kecil agar bisa direview satu per satu.

**Penyesuaian terhadap PRD v1.0** (keputusan setelah PRD ditulis):
- Styling **CSS murni** (CSS variables + file CSS per komponen), bukan Tailwind.
- Aset, teks, dan gambar jagonet.co.id **boleh dipakai**; palet warna **wajib sama**
  dengan Jagonet (sudah ada di `app/app.css`).
- Ikon memakai **SVG inline** (bukan Font Awesome/Remixicon via CDN) agar tidak ada
  script/font pihak ketiga.

**Referensi:**
- **jagonet.co.id**: struktur halaman, konten, aset, dan palet warna.
- **`D:\javascript-projects\82cart\CMS-portfolio\frontend`**: pengalaman (UX), yaitu
  smooth scroll Lenis, scroll reveal (`animations.css` + `useReveal`), gambar shimmer
  lalu fade-in (`SmoothImg`), transisi halaman fade-up, header transparan → solid,
  mega menu, hero slider, marquee, kata berganti, dan hover kartu.

**Keputusan UX (1 Nov 2026):**
- Page loader layar penuh **tidak dipakai**. Konten sudah ada di HTML, jadi hero
  cukup memakai animasi masuk berurutan.
- Hero Beranda memakai **slider gaya CMS** dengan isi slide gaya Jagonet.
- Transisi antar halaman: **fade-up gaya CMS** (0,35 detik).
- Menu header: **mega menu gaya CMS** (di ponsel menjadi akordeon).

**Penyesuaian wajib karena situs di-prerender** (CMS-portfolio adalah SPA):
- Keadaan tersembunyi `.reveal` hanya aktif setelah JavaScript jalan, sehingga
  konten tetap terlihat tanpa JS.
- `SmoothImg` mengecek `img.complete` saat terpasang, karena gambar prerender bisa
  selesai dimuat sebelum React aktif dan shimmer akan macet.
- Lenis dan semua animasi mati bila pengguna memilih `prefers-reduced-motion`.
  Tautan anchor (`/tentang#cabang`) di-scroll lewat Lenis.

**Aturan kerja:** satu fase = satu commit. Setelah fase selesai, saya berhenti dan
Anda mengecek bagian **Cara cek**. Fase berikutnya baru dimulai setelah Anda setuju.

---

## Fase 0 — Fondasi ✅ selesai (`ce823f9`)
- [x] Scaffold Vite 8 + React 19 + React Router 7.18 (prerender, `ssr: false`)
- [x] Palet warna & font stack Jagonet di `app/app.css`, tombol `.btn-primary`
- [x] Logo & favicon Jagonet di `public/brand/`

## Fase 1 — Konten & Komponen Dasar ✅ selesai (`c1aa110`)
- [x] File konten bertipe di `app/content/`: `site`, `packages`, `coverage`, `features`,
      `stats`, `faq`, `sales`, `legal` (isi sementara dari Jagonet + placeholder JITU,
      ditandai `TODO(konten)`)
- [x] Util di `app/lib/`: format Rupiah, pembuat tautan WhatsApp + kode sumber
      (`[WEB-…]`), helper SEO/meta
- [x] Komponen dasar: Section (+ judul/sub-judul bergaya Jagonet), Button
      (primer/sekunder/WhatsApp/terang), Card, Badge, Icon (SVG inline dari
      lucide-react + simple-icons), IconBox, PackageCard
- [x] Struktur CSS: `app.css` (token + reset), `styles/animations.css`, dan satu file
      CSS per komponen
- [x] Fondasi UX dari CMS-portfolio: library animasi, hook `useReveal` + komponen
      `Reveal`, komponen `SmoothImg`, smooth scroll Lenis, dan hover kartu
- [x] Halaman `/ui-kit` untuk mereview komponen dan animasi (tidak di-prerender,
      noindex)

**Cara cek:** buka `http://localhost:5174/ui-kit`. Semua tombol, kartu, badge, ikon,
dan judul section tampil dengan warna Jagonet. Scroll terasa mulus, elemen muncul
dengan animasi saat di-scroll, dan gambar menampilkan shimmer sebelum fade-in.
Matikan JavaScript di DevTools: semua konten tetap terlihat.

## Fase 2 — Layout Global ✅ selesai (`686e934`, perbaikan transisi `82cf3ca`)
- [x] Header fixed: logo, menu, CTA **Daftar**. Transparan dengan logo putih di atas
      hero, lalu putih solid dengan logo hitam setelah scroll (gaya CMS). Halaman
      tanpa latar gelap memakai `handle = { header: 'solid' }`
- [x] Mega menu gaya CMS untuk Tentang Kami & Layanan (panel kiri + kolom tautan,
      animasi fade/geser, tautan masuk berurutan). Panel kiri sementara memakai kotak
      ikon bergradien, belum gambar (pertanyaan terbuka no. 8)
- [x] Menu mobile: hamburger, mega menu menjadi akordeon, scroll halaman dikunci
- [x] Transisi antar halaman fade-up + scroll otomatis ke atas / ke #anchor
- [x] Footer: logo, alamat, kontak, cabang/POP, tautan cepat, media sosial
      (tampil bila diisi), hak cipta
- [x] Widget WhatsApp & telepon melayang (kanan bawah) dengan kode `[WEB-WIDGET]`
- [x] Kerangka semua route (PageHeader + placeholder per fase, semua di-prerender)
      + halaman 404 kustom + tautan "Lewati ke konten"

**Cara cek:** klik semua menu di desktop dan di lebar 360px (DevTools). Mega menu dan
akordeon bisa dipakai dengan keyboard. Pindah halaman terlihat fade-up, dan header
berganti gaya saat di-scroll. URL asal-asalan menampilkan halaman 404.

## Fase 3 — Beranda (`/`) ✅ selesai, menunggu review
- [x] Hero slider gaya CMS: layar penuh, isi slide bergeser (latar diam), teks dan
      CTA muncul berurutan, bar progres yang bisa diklik, panah, tombol jeda, swipe.
      Tiga slide (solusi, paket unlimited, dukungan 24/7) dengan ilustrasi Jagonet
      dalam format WebP. Slide pertama ada di HTML prerender
- [x] Headline dengan kata berganti ("Internet Cepat / Stabil / Unlimited / Terjangkau")
- [x] Kategori layanan → Keunggulan (4 kartu) → Statistik (tersembunyi selama kosong)
- [x] Paket unggulan (3 kartu `featured`) → Cara berlangganan (4 langkah)
- [x] CTA coverage: form GET ke `/coverage?q=…` (berfungsi tanpa JS; hasil
      pencarian di Fase 5)
- [x] Partner (komponen marquee siap, tersembunyi selama kosong) → FAQ singkat
      (akordeon `<details>`) → CTA penutup
- [x] Scroll reveal dengan jeda berurutan di setiap section

**Cara cek:** bandingkan berdampingan dengan jagonet.co.id (warna & isi) dan dengan
CMS-portfolio (gerak & animasi). Urutan section sesuai PRD §3, slider bisa digeser
di ponsel, dan tampilan rapi di lebar 360px.

## Fase 4 — Halaman Informasi
- [ ] Tentang Kami (profil, visi-misi, cabang/POP, galeri opsional)
- [ ] Layanan & Paket (semua paket per kategori, biaya instalasi, ringkasan S&K;
      paket custom → "Hubungi Kami")
- [ ] Kontak (WA/telepon/email, alamat + tombol Google Maps, jam operasional,
      form Kirim Pesan kosmetik)
- [ ] FAQ (akordeon per topik), Syarat & Ketentuan, Kebijakan Privasi

**Cara cek:** semua angka paket sama persis di Beranda dan `/layanan`. Tombol
"Berlangganan" membawa ke `/daftar?paket=…`. Form Kirim Pesan memvalidasi isian lalu
memunculkan modal "Segera Hadir" tanpa mengirim data.

## Fase 5 — Cek Coverage (`/coverage`)
- [ ] Pencarian desa/kecamatan/kota di browser (saran maks. 8, tidak peka huruf besar/kecil)
- [ ] Hasil: **Tersedia** → Daftar Sekarang · **Segera Hadir** → WA "Kabari Saya" ·
      **Belum Tersedia** → WA ajukan area
- [ ] Daftar lengkap area per kota → kecamatan (teks HTML, terindeks Google)
- [ ] Widget mini di Beranda memakai logika yang sama

**Cara cek:** ketik beberapa nama desa (huruf besar/kecil, spasi berlebih). Tab Network
di DevTools tidak menunjukkan request saat mencari.

## Fase 6 — Form Pendaftaran (`/daftar`)
- [ ] 28 field sesuai PRD §6A, banner "segera hadir" + tombol WA
- [ ] Validasi di browser (NIK 16 digit, HP, email, kode pos, usia ≥ 17, foto ≤ 2 MB)
- [ ] Alamat berjenjang Provinsi → Kab/Kota → Kecamatan → Desa dari data coverage
- [ ] Pratinjau foto KTP/rumah lokal, tanda tangan canvas, tombol "Gunakan Lokasi Saya"
- [ ] Biaya bulanan/instalasi otomatis, `?paket=` dan `?area=` mengisi form
- [ ] Kirim → modal "Segera Hadir"; data tidak dikirim dan tidak disimpan

**Cara cek:** isi form dengan data salah lalu benar. Pastikan Network kosong saat
kirim, dan Application → Storage tidak menyimpan apa pun.

## Fase 7 — Cek Tagihan (`/cek-tagihan`)
- [ ] Form ID pelanggan / No. WA (kosmetik) + modal "Segera Hadir"
- [ ] Section Cara Pembayaran (lihat pertanyaan terbuka no. 4)

**Cara cek:** validasi format input dan modal muncul. Tombol "Salin" menyalin teks.

## Fase 8 — SEO & Keamanan
- [ ] `<title>`, meta description, canonical, Open Graph unik per halaman
- [ ] JSON-LD `LocalBusiness`, `Service`/`Offer` (Layanan), `FAQPage` (FAQ)
- [ ] `sitemap.xml` + `robots.txt` otomatis saat build
- [ ] `public/_headers`: CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy
- [ ] 404 berstatus HTTP 404 di Cloudflare (tanpa fallback SPA)

**Cara cek:** buka `build/client/` dan lihat HTML per halaman. Uji hasil build di
validator Rich Results Google setelah staging live.

## Fase 9 — Performa, Konten Final & Go-Live
- [ ] Optimasi gambar (logo 96 KB → WebP kecil, `srcset`, lazy-load) dan aset hero
- [ ] Audit Lighthouse mobile (Performance & A11y ≥ 90, SEO & Best Practices ≥ 95)
- [ ] Pasang konten final JITU, hapus semua placeholder
- [ ] Proyek Cloudflare Pages (staging → domain produksi), README panduan konten

**Cara cek:** laporan Lighthouse dari URL staging, lalu situs live di domain produksi.

---

## Pertanyaan Terbuka (perlu jawaban sebelum fase terkait)

| # | Pertanyaan | Dibutuhkan di |
|---|---|---|
| 1 | Paket & harga JITU di Bali: sama dengan Jagonet atau berbeda? | Fase 1 (sementara pakai paket Jagonet) |
| 2 | Kontak JITU: nomor WA sales & support, telepon, email, alamat kantor Ubud, jam operasional, media sosial | Fase 2 |
| 3 | Daftar area coverage (desa/kecamatan di Ubud/Gianyar) beserta statusnya | Fase 5 |
| 4 | Cek Tagihan & Cara Pembayaran: transfer manual + konfirmasi WA (PRD v1.0), atau diarahkan ke tautan tagihan/VA dari sistem billing (PRD billing v4.0)? | Fase 7 |
| 5 | Ilustrasi hero & peta coverage: pakai milik Jagonet (peta Jawa Timur) atau perlu peta Bali? | Fase 3 |
| 6 | Saat go-live, form kosmetik ditampilkan (`preview`) atau disembunyikan (`hidden`)? | Fase 9 |
| 7 | Domain produksi | Fase 9 |
| 8 | Gambar panel mega menu (Tentang Kami, Layanan): pakai gambar dari Jagonet atau foto JITU sendiri? | Fase 2 (sementara pakai Jagonet) |
| 9 | Isi slide hero (3–4 slide): gambar & teks apa saja? | Fase 3 (sementara pakai banner Jagonet) |
