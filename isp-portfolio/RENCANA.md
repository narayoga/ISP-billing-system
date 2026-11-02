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

## Fase 3 — Beranda (`/`) ✅ selesai (`8d18ad1`, revisi hero `0742a54` `054a490` `bdb204b`)
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

## Fase 4 — Halaman Informasi ✅ selesai (`0b09514`, revisi `cf418f4` `d43ce3b`)
- [x] Tentang Kami: profil + ilustrasi, visi-misi (`#visi-misi`), cabang/POP
      (`#cabang`), galeri otomatis tersembunyi selama `site.gallery` kosong
- [x] Layanan & Paket: paket rumah (`#rumah`), bisnis dedicated (`#bisnis`, paket
      custom → "Hubungi Kami" via WA), biaya instalasi + ringkasan S&K
- [x] Kontak: kanal WA/telepon/email (WA dukungan muncul bila nomornya beda), alamat
      + tombol Google Maps, jam operasional, form Kirim Pesan kosmetik (validasi,
      modal Segera Hadir, input tanpa `name` sehingga tanpa JS pun data tidak ikut URL)
- [x] FAQ (akordeon `<details>` per topik + navigasi topik), Syarat & Ketentuan,
      Kebijakan Privasi (draf; menyatakan form belum mengirim/menyimpan data)
- [x] Komponen baru: Modal (`<dialog>`), ComingSoonModal, Field/Input/Select/
      Textarea, LegalDocument, `lib/validation.ts` (dipakai lagi di Fase 6–7)
- [x] Widget WA disembunyikan di layar kecil selama mengisi field (US-03 AC 4)
- [x] Revisi: section Rumah bernuansa JaberNITE LITE (merah muda) dan Bisnis
      JaberNITE HOME (biru) lewat kelas `.theme-lite` / `.theme-home`, judul rata kiri;
      mega menu Layanan jadi 2 baris besar; galeri masonry 12 foto Jagonet (di-crop
      rasio campur oleh `npm run gallery` / sharp) setelah Visi & Misi; peta
      Leaflet + OpenStreetMap (tanpa API key, dimuat saat mendekati layar) di
      kanan section Lokasi — titik pin sementara pusat Ubud (`site.address.geo`)

**Cara cek:** semua angka paket sama persis di Beranda dan `/layanan`. Tombol
"Berlangganan" membawa ke `/daftar?paket=…`. Form Kirim Pesan memvalidasi isian lalu
memunculkan modal "Segera Hadir" tanpa mengirim data.

## Fase 5 — Cek Coverage (`/coverage`) ✅ selesai (`289c3bd`, peta ODP `34102d4` `6adcb2d`)
- [x] Pencarian desa/kecamatan/kota di browser (`lib/coverage.ts`): saran maks. 8,
      tidak peka huruf besar/kecil, aksen, dan spasi berlebih; awalan yang diketik
      ("kec.", "kab.", "desa") memprioritaskan tingkat wilayah tersebut
- [x] Combobox ARIA: panah atas/bawah, Enter, Esc; klik saran dengan mouse
- [x] Hasil: **Tersedia** → Daftar Sekarang (`/daftar?area=…`) · **Segera Hadir** →
      WA "Kabari Saya" · **Belum Tersedia** → WA ajukan area · kecamatan/kabupaten →
      ringkasan semua desa beserta aksinya
- [x] Daftar lengkap area per kota → kecamatan (teks HTML, terindeks Google), dengan
      peta titik ODP di kanannya: hijau = Tersedia, kuning = Segera Hadir + legenda
      (koordinat `odp` per desa di content/coverage.ts, perkiraan/kosmetik); daftar dan
      peta setinggi sama (tidak sticky), daftar di-scroll di panelnya bila area bertambah
- [x] Widget mini di Beranda memakai komponen & data yang sama; tanpa JS jatuh ke
      `/coverage?q=…`, yang dibaca setelah hidrasi (`useHydrated`)

**Cara cek:** ketik beberapa nama desa (huruf besar/kecil, spasi berlebih). Tab Network
di DevTools tidak menunjukkan request saat mencari.

## Fase 6 — Form Pendaftaran (`/daftar`) ✅ selesai (`bcf5a56`, revisi `9a16a8f` `75b8b02` `353010c`)
- [x] 28 field sesuai PRD §6A dalam 5 langkah (Data Diri, Dokumen, Alamat Pemasangan,
      Layanan, Persetujuan) — tanpa banner "segera hadir", cukup modal saat kirim
- [x] Validasi di browser (NIK 16 digit / SIM 12–16, NPWP 15/16, HP, email, kode pos,
      usia ≥ 17, tautan Google Maps, voucher, foto JPG/PNG ≤ 2 MB); pesan galat di
      bawah field
- [x] Revisi: tombol Kirim menampilkan loading "Memeriksa isian…"; bila gagal,
      ringkasan galat muncul di paling atas formulir dan halaman kembali ke sana
      (tiap butir bisa diklik untuk lompat ke field-nya)
- [x] Revisi: isian teks, pilihan & centang persetujuan disimpan di sessionStorage
      tab (tidak hilang saat refresh, hilang saat tab ditutup); foto & tanda tangan
      tidak ikut disimpan. Prefill `?paket=`/`?area=` dari tautan baru tetap menang
- [x] Alamat berjenjang Provinsi → Kab/Kota → Kecamatan → Desa dari area **Tersedia**;
      mengganti level atas mengosongkan level di bawahnya
- [x] Pratinjau foto KTP/rumah lokal (`blob:`), tanda tangan canvas (mouse/jari),
      tombol "Gunakan Lokasi Saya" (Geolocation diproses di perangkat)
- [x] Biaya bulanan/instalasi otomatis, tanggal registrasi hari ini (read-only),
      `?paket=` dan `?area=` mengisi form (dibaca setelah hidrasi)
- [x] Kirim → modal "Segera Hadir" + WA berisi nama paket saja; diuji: 0 request
      jaringan, localStorage, cookie, IndexedDB kosong; tombol Kirim nonaktif
      sampai JS siap sehingga form tak pernah terkirim apa adanya
- [x] Flag `site.forms.daftar = 'hidden'` menampilkan ajakan daftar via WA

**Cara cek:** isi sebagian form lalu klik Kirim — muncul loading, lalu halaman naik
ke ringkasan galat di atas. Refresh: isian tetap ada. Pastikan Network kosong saat
kirim; Application → Storage hanya berisi sessionStorage `jitu-daftar`.

## Fase 7 — Cek Tagihan (`/cek-tagihan`) ✅ selesai, menunggu review
- [x] Form satu isian ID pelanggan / No. WA (jenis terdeteksi otomatis, validasi
      format), loading "Memeriksa…", lalu modal "Segera Hadir" + WA dukungan
      (`WEB-TAGIHAN`, tanpa data dari form); tanpa fetch/penyimpanan
- [x] Cara Pembayaran (pertanyaan no. 4 → keduanya): **Virtual Account** sebagai cara
      utama — tab bank (BCA, BNI, BRI, Mandiri, Permata) + langkah per kanal
      (m-banking/ATM/internet banking) di `content/payment.ts`; **Transfer Manual**
      sebagai alternatif — rekening dari `site.payment` + tombol "Salin" +
      "Konfirmasi via WhatsApp"
- [x] Flag `forms.cekTagihan = 'hidden'` menyembunyikan form, Cara Pembayaran tetap
- [x] `Button` punya prop `loading` (spinner), dipakai juga di form pendaftaran

**Cara cek:** isi `ab`, `0812`, lalu `JITU-00123` / `081234567890` — pesan galat &
label "Terdeteksi" berubah; Cek Tagihan → loading lalu modal. Ganti tab bank (klik /
panah kiri-kanan), buka langkah per kanal. Tombol "Salin" → "Tersalin".

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
| 4 | ~~Cek Tagihan & Cara Pembayaran: transfer manual atau VA?~~ **Keduanya** — VA utama, transfer manual + konfirmasi WA alternatif. Daftar bank VA & rekening transfer masih sementara | Fase 7 ✅ |
| 5 | Ilustrasi hero & peta coverage: pakai milik Jagonet (peta Jawa Timur) atau perlu peta Bali? | Fase 3 |
| 6 | Saat go-live, form kosmetik ditampilkan (`preview`) atau disembunyikan (`hidden`)? | Fase 9 |
| 7 | Domain produksi | Fase 9 |
| 8 | Gambar panel mega menu (Tentang Kami, Layanan): pakai gambar dari Jagonet atau foto JITU sendiri? | Fase 2 (sementara pakai Jagonet) |
| 9 | Isi slide hero (3–4 slide): gambar & teks apa saja? | Fase 3 (sementara pakai banner Jagonet) |
