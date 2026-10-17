# Product Requirements Document (PRD)

**Nama Proyek:** Landing Page ISP — `isp-portfolio`\
**Versi:** 1.0\
**Tanggal:** 29 September 2026\
**Status:** Draft — untuk diskusi

> **Ringkasan:** `isp-portfolio` adalah situs publik resmi ISP (company profile +
> katalog layanan) yang dibangun sebagai **situs statis hasil prerender**. Seluruh
> data — paket, harga, area coverage, kontak — ditulis di file konten, dan situs
> di-*build* ulang setiap kali ada perubahan. Form pendaftaran, cek tagihan, dan
> kirim pesan tampil lengkap namun pada versi ini masih **kosmetik**: tidak dapat
> dikirim dan tidak menyimpan data. Acuan struktur & UX: jagonet.co.id (**Lampiran A**).

---

## 1. Ruang Lingkup dan Tujuan

### Ringkasan Eksekutif

Calon pelanggan internet umumnya mencari informasi lewat mesin pencari dan media
sosial sebelum menghubungi penyedia layanan. Tanpa situs resmi, informasi paket,
harga, dan jangkauan hanya tersebar lewat percakapan WhatsApp — calon pelanggan
sulit membandingkan, dan tim penjualan menjawab pertanyaan yang sama berulang kali.

`isp-portfolio` menjadi etalase digital resmi ISP: memperkenalkan perusahaan,
menampilkan paket & harga secara transparan, memudahkan calon pelanggan mengecek
ketersediaan jaringan di lokasinya, lalu mengarahkan mereka ke kanal kontak
(WhatsApp/telepon).

Versi 1.0 sengaja dibatasi sebagai **front-end statis tanpa backend**. Situs menjadi
cepat, murah di-hosting, minim permukaan serangan, dan dapat segera live. Form
pendaftaran, cek tagihan, dan kirim pesan tetap dibangun lengkap tampilan, alur,
dan validasinya — sehingga dapat diuji dan disetujui lebih awal — namun belum
mengirim atau menyimpan data apa pun. Aktivasi form dijadwalkan pada tahap
berikutnya (**Bagian 12**).

### Tujuan Utama (Objective)

Menghadirkan situs resmi ISP yang informatif, cepat, dan mudah ditemukan di mesin
pencari, yang mengonversi pengunjung menjadi calon pelanggan melalui kanal
WhatsApp/telepon, dengan biaya operasional mendekati nol dan proses pembaruan
konten yang sederhana.

**Indikator keberhasilan:**

| Indikator | Target |
|---|---|
| Situs live & terindeks | Seluruh halaman publik terindeks Google ≤ 4 minggu setelah go-live (dipantau via Google Search Console) |
| Skor Lighthouse (mobile) | Performance & Accessibility ≥ 90; SEO & Best Practices ≥ 95 |
| Kemudahan pembaruan | Perubahan paket/harga/area cukup mengedit 1 file konten; tampil di situs ≤ 10 menit setelah commit |
| Konversi | Prospek dari situs dapat dihitung melalui kode sumber pada pesan WhatsApp otomatis (lihat US-03); target angka ditetapkan pemilik bisnis |
| Ketergantungan server | 0 request ke server aplikasi saat situs diakses |

### Ruang Lingkup (In-Scope)

**A. Halaman Informasi**
- Beranda, Tentang Kami, Layanan & Paket, Kontak, FAQ, Syarat & Ketentuan,
  Kebijakan Privasi, dan halaman 404.
- Navigasi global: header dengan menu dropdown dan CTA "Daftar", menu mobile,
  footer, serta widget WhatsApp/telepon melayang di semua halaman.

**B. Halaman Interaktif**
- Cek Coverage — pencarian area berbasis data statis, **berfungsi penuh** di browser.
- Form Pendaftaran Berlangganan lengkap — **kosmetik**.
- Cek Tagihan — form **kosmetik** + informasi Cara Pembayaran (statis).
- Form Kirim Pesan di halaman Kontak — **kosmetik**.

**C. Pengelolaan Konten Statis**
- Seluruh konten (brand, kontak, paket, coverage, FAQ, S&K) terpusat di folder
  `app/content/` dengan tipe data TypeScript.
- Pembaruan konten = edit file → commit → build ulang otomatis.
- Identitas brand (nama, logo, warna) terpusat sehingga rebranding tidak menyentuh
  komponen.

**D. SEO, Performa & Aksesibilitas**
- HTML statis per halaman (prerender), meta & Open Graph, data terstruktur
  (JSON-LD), `sitemap.xml`, `robots.txt`.
- Target performa, aksesibilitas, dan keamanan sesuai **Bagian 10**.

### Di Luar Ruang Lingkup (Out-of-Scope)

Ditangguhkan ke tahap berikutnya (lihat **Bagian 12**):
- Backend/API apa pun.
- Pengiriman dan penyimpanan data form (pendaftaran, cek tagihan, kirim pesan).
- Proteksi anti-spam (captcha, honeypot, rate limit) — belum relevan selama form
  belum aktif.
- Data paket/coverage dinamis dari server.
- Cek tagihan fungsional dan pembayaran online (payment gateway).
- Akun/login pelanggan.
- Peta coverage interaktif.
- Blog, berita, promo dinamis, atau CMS.
- Multi-bahasa (situs hanya berbahasa Indonesia).
- Tools jaringan (speedtest, grafik trafik/MRTG).

### Asumsi

- `isp-portfolio` berada di repo yang sama sebagai folder tersendiri, namun
  **berdiri sendiri**: tidak bergantung pada — dan tidak memengaruhi — aplikasi
  lain di repo, serta dapat di-build dan di-deploy secara mandiri.
- Hosting memakai Cloudflare Pages (paket gratis) dengan build otomatis dari repo.
- Konten final disediakan pemilik bisnis; selama belum tersedia dipakai placeholder
  (daftar kebutuhan di **Bagian 14**).

---

## 2. Aktor Pengguna

| Aktor | Deskripsi | Cara Mengakses Sistem |
|---|---|---|
| **Pengunjung / Calon Pelanggan** | Masyarakat atau pelaku usaha di area layanan yang mencari layanan internet | Browser (mayoritas ponsel) melalui mesin pencari, media sosial, atau tautan langsung |
| **Pelanggan Eksisting** | Pelanggan aktif yang mencari info tagihan, cara bayar, atau kontak dukungan | Browser — halaman Cek Tagihan & Kontak |
| **Pengelola Konten** | Developer yang memelihara kode dan memperbarui file konten | Repo git (`isp-portfolio/app/content/`) + dashboard Cloudflare Pages |
| **Pemilik Bisnis / Marketing** | Penyedia dan penyetuju konten: brand, harga, area, klaim pemasaran | Me-review situs staging; menyerahkan materi ke Pengelola Konten |

Situs tidak memiliki login maupun area admin; seluruh pengelolaan dilakukan
melalui repo.

---

## 3. Peta Situs & Struktur Halaman

### Peta Situs

| Route | Halaman | Isi Utama | Sumber Data |
|---|---|---|---|
| `/` | Beranda | Lihat *Urutan Section Beranda* di bawah | `site`, `packages`, `features`, `stats`, `faq`, `coverage` |
| `/tentang` | Tentang Kami | Profil perusahaan, visi & misi, cabang/POP, galeri (opsional) | `site` |
| `/layanan` | Layanan & Paket | Kategori layanan (Rumah/Bisnis), seluruh paket, biaya instalasi, ringkasan S&K | `packages`, `site` |
| `/coverage` | Cek Coverage | Kotak pencarian area, hasil + CTA, daftar lengkap area per kota/kecamatan | `coverage` |
| `/daftar` | Form Pendaftaran | Form berlangganan lengkap (kosmetik) | `packages`, `coverage`, `sales`, `site` |
| `/cek-tagihan` | Cek Tagihan | Form cek tagihan (kosmetik), cara pembayaran | `site` |
| `/kontak` | Kontak Kami | WhatsApp, telepon, email, alamat + tautan Google Maps, jam operasional, form kirim pesan (kosmetik) | `site` |
| `/faq` | FAQ | Tanya-jawab lengkap, dikelompokkan per topik | `faq` |
| `/syarat-ketentuan` | Syarat & Ketentuan | Teks legal | `legal` |
| `/kebijakan-privasi` | Kebijakan Privasi | Teks legal | `legal` |
| *(URL lain)* | 404 | Pesan halaman tidak ditemukan + tautan kembali | — |

### Navigasi Global

- **Header (sticky):** logo · Beranda · Tentang Kami ▾ (Profil, Cabang) ·
  Layanan ▾ (Internet Rumah, Internet Bisnis, Semua Paket) · Cek Coverage ·
  Cek Tagihan · Kontak · tombol CTA **Daftar**. Item dropdown menautkan ke anchor
  section terkait (mis. `/tentang#cabang`, `/layanan#bisnis`).
- **Menu mobile:** tombol hamburger membuka panel navigasi; dropdown berubah menjadi
  akordeon.
- **Widget melayang (kanan bawah):** tombol WhatsApp dan telepon Sales di semua
  halaman; di layar kecil tampil ringkas agar tidak menutupi konten.
- **Footer:** logo & deskripsi singkat, alamat kantor pusat, kontak, daftar
  cabang/POP, tautan cepat (Layanan, Coverage, FAQ, S&K, Kebijakan Privasi), ikon
  media sosial, hak cipta.

### Urutan Section Beranda

| # | Section | Isi | Catatan |
|---|---|---|---|
| 1 | Hero | Headline, sub-headline, CTA "Berlangganan" (→ `/daftar`) & "Cek Coverage" (→ `/coverage`), ilustrasi | Elemen LCP — gambar dioptimasi dan dimuat prioritas |
| 2 | Kategori Layanan | Kartu Internet Rumah, Internet Bisnis (dan kategori lain sesuai konten) | Tautan ke `/layanan#…` |
| 3 | Keunggulan | 4 kartu ikon (mis. kecepatan, keandalan, pemantauan jaringan, dukungan 24/7) | Dari `features` |
| 4 | Statistik | Angka pencapaian (pelanggan, area, dsb.) | **Hanya tampil bila angka diisi**; nilai akhir sudah tertulis di HTML |
| 5 | Paket Unggulan | Maksimal 3 kartu paket unggulan + tautan "Lihat semua paket" | Dari `packages` (`featured: true`) |
| 6 | Cara Berlangganan | 4 langkah: Cek coverage → Isi formulir / hubungi kami → Survei & instalasi → Internet aktif | — |
| 7 | CTA Coverage | Ajakan cek ketersediaan + widget pencarian mini | Logika sama dengan `/coverage` |
| 8 | Partner / Testimoni | Logo mitra atau kutipan pelanggan | Opsional — hanya bila materi nyata tersedia |
| 9 | FAQ Singkat | 4–6 pertanyaan teratas + tautan ke `/faq` | Dari `faq` |
| 10 | CTA Penutup | Ajakan berlangganan + tombol WhatsApp | — |

---

## 4. User Stories

### A. Modul Informasi & Navigasi

**US-01 — Melihat Beranda**
Sebagai calon pelanggan, saya ingin melihat ringkasan layanan, keunggulan, dan
paket unggulan dalam satu halaman, sehingga saya cepat memahami penawaran ISP tanpa
membuka banyak halaman.

**US-02 — Mengenal Perusahaan**
Sebagai calon pelanggan, saya ingin membaca profil, visi-misi, dan lokasi cabang
perusahaan, sehingga saya yakin ISP ini kredibel dan dekat dengan lokasi saya.

**US-03 — Menghubungi ISP**
Sebagai pengunjung, saya ingin menghubungi ISP melalui WhatsApp atau telepon dari
halaman mana pun, sehingga saya bisa bertanya langsung tanpa mencari-cari nomor
kontak.

**US-04 — Membaca FAQ dan Ketentuan**
Sebagai calon pelanggan, saya ingin membaca jawaban atas pertanyaan umum serta
syarat & ketentuan dan kebijakan privasi, sehingga saya memahami aturan layanan
sebelum berlangganan.

### B. Modul Paket

**US-05 — Melihat Paket & Harga**
Sebagai calon pelanggan, saya ingin melihat seluruh paket beserta kecepatan, harga
bulanan, dan fiturnya, sehingga saya dapat memilih paket yang sesuai kebutuhan dan
anggaran.

### C. Modul Coverage

**US-06 — Mengecek Ketersediaan Jaringan**
Sebagai calon pelanggan, saya ingin mencari desa/kecamatan saya dan langsung
mengetahui apakah jaringan sudah tersedia, sehingga saya tahu apakah bisa
berlangganan sekarang.

### D. Modul Pendaftaran *(kosmetik di v1.0)*

**US-07 — Mengisi Formulir Pendaftaran**
Sebagai calon pelanggan, saya ingin mengisi formulir berlangganan dengan data
lengkap dan paket pilihan saya, sehingga proses pendaftaran jelas sejak awal. Pada
versi ini formulir belum dapat dikirim; saya diarahkan ke WhatsApp untuk
menyelesaikan pendaftaran.

### E. Modul Tagihan *(form kosmetik di v1.0)*

**US-08 — Cek Tagihan & Cara Pembayaran**
Sebagai pelanggan eksisting, saya ingin mengecek tagihan dan mengetahui cara
membayarnya, sehingga saya dapat melunasi tagihan tepat waktu.

### F. Modul Pengelolaan Konten

**US-09 — Memperbarui Konten**
Sebagai pengelola konten, saya ingin mengubah paket, harga, area coverage, dan
informasi kontak cukup dengan mengedit file konten, sehingga pembaruan cepat dan
tidak berisiko merusak tampilan.

### G. Non-Fungsional

**US-10 — Mudah Ditemukan & Cepat Diakses**
Sebagai pemilik bisnis, saya ingin situs muncul di hasil pencarian untuk kata kunci
seperti "internet [nama kota]" dan terbuka cepat di jaringan seluler, sehingga lebih
banyak calon pelanggan menemukan situs dan tidak langsung meninggalkannya.

**US-11 — Nyaman di Semua Perangkat**
Sebagai pengunjung, saya ingin situs mudah dibaca dan dioperasikan di ponsel maupun
desktop — termasuk dengan keyboard dan pembaca layar — sehingga saya dapat
memperoleh informasi tanpa hambatan.

---

## 5. Acceptance Criteria

### US-01 (Beranda)
- **AC 1:** Beranda menampilkan section sesuai urutan di **Bagian 3**; section
  Statistik dan Partner/Testimoni otomatis tersembunyi bila datanya kosong.
- **AC 2:** CTA "Berlangganan" mengarah ke `/daftar` dan CTA "Cek Coverage" ke
  `/coverage`.
- **AC 3:** Paket unggulan diambil dari `packages` yang bertanda `featured: true`
  (maksimal 3), dengan nama, kecepatan, dan harga identik dengan halaman `/layanan`.
- **AC 4:** Angka statistik sudah tertulis di HTML hasil build; animasi hitung (bila
  ada) hanya efek tambahan dan tidak pernah menampilkan "0" sebagai nilai akhir.

### US-02 (Tentang Kami)
- **AC 1:** Halaman menampilkan profil, visi, misi, dan daftar cabang/POP (nama,
  alamat, kontak) dari `site`.
- **AC 2:** Item dropdown "Tentang Kami" menautkan langsung ke section terkait
  (mis. `/tentang#cabang`).
- **AC 3:** Section galeri hanya tampil bila foto tersedia.

### US-03 (Kontak & WhatsApp Melayang)
- **AC 1:** Widget WhatsApp & telepon tampil di semua halaman; tautan memakai format
  `https://wa.me/<nomor>?text=<pesan>` dan `tel:<nomor>` dengan nomor dari `site`.
- **AC 2:** Pesan WhatsApp otomatis menyertakan kode sumber halaman (mis.
  `[WEB-PAKET]`, `[WEB-COVERAGE]`, `[WEB-WIDGET]`) agar CS dapat menghitung prospek
  yang berasal dari situs.
- **AC 3:** Halaman Kontak menampilkan nomor WhatsApp/telepon (sales dan dukungan
  teknis bila berbeda), email, alamat, jam operasional, dan tombol "Buka di Google
  Maps" (tautan, bukan embed peta).
- **AC 4:** Widget tidak menutupi tombol atau field form pada lebar layar ≥ 360px.

### US-04 (FAQ & Legal)
- **AC 1:** Halaman FAQ menampilkan seluruh tanya-jawab dari `faq`, dikelompokkan per
  topik, dalam pola akordeon yang dapat dioperasikan dengan keyboard.
- **AC 2:** Halaman Syarat & Ketentuan dan Kebijakan Privasi dapat diakses dari
  footer dan dari kotak persetujuan pada form.
- **AC 3:** Kebijakan Privasi menyatakan secara jujur bahwa pada versi ini form belum
  mengirim maupun menyimpan data.

### US-05 (Paket & Harga)
- **AC 1:** Halaman `/layanan` menampilkan semua paket dari `packages`, dikelompokkan
  per kategori, dengan urutan sesuai urutan di file konten.
- **AC 2:** Harga tampil dalam format Rupiah `id-ID` (mis. `Rp175.500/bulan`); paket
  bertanda `isCustomPrice: true` menampilkan "Hubungi Kami" dan tombolnya membuka
  WhatsApp.
- **AC 3:** Kartu paket menampilkan nama, kecepatan unduh/unggah, harga, badge (bila
  ada), dan daftar fitur.
- **AC 4:** Tombol "Berlangganan" mengarah ke `/daftar?paket=<slug>` dan paket
  tersebut otomatis terpilih di form.
- **AC 5:** Biaya instalasi dan ringkasan S&K ditampilkan di bawah daftar paket,
  disertai label "Syarat & ketentuan berlaku".
- **AC 6:** Tidak ada request jaringan untuk mengambil data paket — seluruh data
  sudah ada di HTML.

### US-06 (Cek Coverage)
- **AC 1:** Pengunjung dapat mengetik nama desa/kelurahan, kecamatan, atau kota;
  pencarian tidak peka huruf besar/kecil dan mengabaikan spasi berlebih; saran
  muncul saat mengetik (maksimal 8).
- **AC 2:** Hasil menampilkan salah satu status:
  **Tersedia** — CTA "Daftar Sekarang" ke `/daftar?area=<id>` dengan alamat
  terisi otomatis;
  **Segera Hadir** — CTA WhatsApp "Kabari Saya";
  **Belum Tersedia** (area tidak ditemukan) — CTA WhatsApp untuk mengajukan area.
- **AC 3:** Daftar lengkap area (dikelompokkan per kota → kecamatan) tampil sebagai
  teks HTML di bawah kotak pencarian sehingga dapat diindeks mesin pencari.
- **AC 4:** Pencarian berjalan sepenuhnya di browser tanpa request jaringan.
- **AC 5:** Widget pencarian mini di Beranda memakai logika dan data yang sama.

### US-07 (Formulir Pendaftaran)
- **AC 1:** Form memuat seluruh field pada **Bagian 6A** dengan label yang jelas dan
  penanda wajib (*).
- **AC 2:** Banner di atas form menyatakan bahwa pendaftaran online segera hadir,
  disertai tombol WhatsApp untuk mendaftar sekarang.
- **AC 3:** Validasi berjalan di browser (wajib diisi, NIK 16 digit angka, nomor HP
  Indonesia, email, kode pos 5 digit, tipe & ukuran foto); pesan kesalahan tampil di
  dekat field terkait.
- **AC 4:** Dropdown Provinsi → Kabupaten/Kota → Kecamatan → Desa/Kelurahan terisi
  berjenjang dari `coverage` (hanya area berstatus Tersedia); mengganti pilihan
  level atas mengosongkan level di bawahnya.
- **AC 5:** Memilih paket mengisi otomatis Biaya Bulanan; Biaya Instalasi terisi dari
  `site`; Tanggal Registrasi berisi tanggal hari ini dan tidak dapat diubah.
- **AC 6:** Foto KTP/rumah hanya dipratinjau secara lokal; tanda tangan digambar di
  canvas dan dapat dihapus.
- **AC 7:** Menekan **Kirim** setelah validasi lolos menampilkan modal "Pendaftaran
  online segera hadir" dengan tombol WhatsApp. Data form **tidak** dikirim ke
  jaringan dan **tidak** disimpan di browser (localStorage, sessionStorage,
  IndexedDB, maupun cookie).
- **AC 8:** Parameter URL `?paket=<slug>` dan `?area=<id>` mengisi otomatis pilihan
  paket dan alamat.
- **AC 9:** Bila flag `forms.daftar` bernilai `hidden`, halaman `/daftar` tidak
  dibangun dan seluruh tautan ke halaman tersebut diarahkan ke WhatsApp.

### US-08 (Cek Tagihan)
- **AC 1:** Form menerima ID pelanggan atau nomor WhatsApp dengan validasi format.
- **AC 2:** Menekan **Cek Tagihan** menampilkan modal "Cek tagihan online segera
  hadir" dengan tombol WhatsApp ke CS; tidak ada request jaringan.
- **AC 3:** Section "Cara Pembayaran" menampilkan rekening tujuan (bank, nomor, atas
  nama) dari `site`, langkah pembayaran, dan tombol konfirmasi pembayaran via
  WhatsApp.
- **AC 4:** Nomor rekening dapat disalin dengan satu klik (tombol "Salin").
- **AC 5:** Bila flag `forms.cekTagihan` bernilai `hidden`, form disembunyikan dan
  halaman tetap tampil dengan section Cara Pembayaran.

### US-09 (Pengelolaan Konten)
- **AC 1:** Seluruh teks brand, kontak, paket, area, FAQ, dan legal berada di
  `isp-portfolio/app/content/`; komponen tidak memuat teks konten yang di-hardcode.
- **AC 2:** Setiap file konten memiliki tipe TypeScript; data yang tidak sesuai tipe
  (mis. harga ditulis sebagai teks) membuat build gagal sehingga tidak pernah
  terpublikasi.
- **AC 3:** Setelah perubahan di-commit ke branch produksi, Cloudflare Pages
  membangun ulang situs dan perubahan tampil ≤ 10 menit.
- **AC 4:** README `isp-portfolio` memuat panduan langkah demi langkah untuk
  memperbarui paket, harga, dan area coverage.
- **AC 5:** Mengganti nama, logo, dan warna brand cukup dilakukan di `site.ts`, file
  logo di `public/`, dan token `@theme`.

### US-10 (SEO & Performa)
- **AC 1:** Setiap route menghasilkan file HTML statis berisi konten lengkap yang
  tetap terbaca meski JavaScript dimatikan (kecuali elemen yang memang interaktif).
- **AC 2:** Setiap halaman memiliki `<title>`, meta description, canonical URL, serta
  tag Open Graph/Twitter Card yang unik.
- **AC 3:** Tersedia `sitemap.xml` dan `robots.txt`; JSON-LD `Organization`/
  `LocalBusiness` di semua halaman, `Service` + `Offer` di halaman Layanan, dan
  `FAQPage` di halaman FAQ.
- **AC 4:** Skor Lighthouse mobile memenuhi target **Bagian 10** pada halaman Beranda,
  Layanan, dan Daftar.
- **AC 5:** Saat situs diakses tidak ada request selain aset statis milik situs
  sendiri (diverifikasi lewat tab Network di DevTools), kecuali analytics opsional
  yang telah disetujui.
- **AC 6:** URL yang tidak dikenal mengembalikan status HTTP 404 dengan halaman 404
  kustom (bukan *soft-404*).

### US-11 (Responsif & Aksesibilitas)
- **AC 1:** Tata letak berfungsi baik mulai lebar 360px hingga desktop tanpa scroll
  horizontal.
- **AC 2:** Menu, dropdown, akordeon, modal, dan form dapat dioperasikan dengan
  keyboard; fokus terlihat jelas; modal mengunci fokus dan dapat ditutup dengan
  tombol Esc.
- **AC 3:** Kontras warna teks memenuhi WCAG 2.1 AA; semua gambar bermakna memiliki
  teks alternatif; setiap input memiliki label.
- **AC 4:** Atribut `lang="id"` terpasang dan heading tersusun hierarkis (satu `h1`
  per halaman).

---

## 6. Spesifikasi Form (Kosmetik)

### Prinsip Umum

- Form dibangun lengkap — tampilan, alur, dan validasi — agar siap disambungkan ke
  backend pada tahap berikutnya.
- **Tidak ada data yang meninggalkan browser:** tanpa `fetch`/XHR, tanpa
  `<form action>` yang mengirim data, dan tanpa penyimpanan apa pun (localStorage,
  sessionStorage, IndexedDB, cookie). Data hilang saat halaman ditutup atau dimuat
  ulang.
- Foto hanya dipratinjau secara lokal (`URL.createObjectURL`, dilepas setelah tidak
  dipakai); tanda tangan digambar di elemen canvas lokal.
- Setiap form kosmetik diawali banner: *"Fitur ini segera hadir. Untuk saat ini,
  silakan hubungi kami melalui WhatsApp."* + tombol WhatsApp.
- Tombol kirim menjalankan validasi; bila lolos, tampil modal "Segera Hadir" dengan
  tombol WhatsApp. Pesan WhatsApp hanya berisi nama paket (bila relevan) dan kode
  sumber halaman — **tanpa data pribadi** dari form.
- Perilaku setiap form diatur flag di `site.ts`:
  - `preview` — form tampil sebagai pratinjau (perilaku di atas);
  - `hidden` — form tidak dirender; halaman yang isinya hanya form (`/daftar`) tidak
    dibangun dan semua tautan ke halaman itu diarahkan ke WhatsApp, sedangkan halaman
    lain tetap tampil tanpa form.

### A. Form Pendaftaran Berlangganan (`/daftar`)

| # | Field | Tipe | Wajib | Validasi | Catatan |
|---|---|---|---|---|---|
| 1 | Foto KTP | file (gambar) | Ya | JPG/PNG, maks. 2 MB | Pratinjau lokal |
| 2 | Foto Rumah | file (gambar) | Tidak | JPG/PNG, maks. 2 MB | Pratinjau lokal; membantu survei lokasi |
| 3 | Nama Lengkap | teks | Ya | 3–150 karakter | Sesuai identitas |
| 4 | Email | email | Ya | Format email valid | — |
| 5 | No. HP / WhatsApp | tel | Ya | 10–15 digit, diawali `08` atau `62` | — |
| 6 | Jenis Kelamin | radio | Ya | Laki-laki / Perempuan | — |
| 7 | Tempat Lahir | teks | Ya | Maks. 100 karakter | — |
| 8 | Tanggal Lahir | tanggal | Ya | Usia ≥ 17 tahun | — |
| 9 | Jenis Identitas | pilihan | Ya | KTP / SIM | — |
| 10 | Nomor Identitas | teks (angka) | Ya | KTP: tepat 16 digit; SIM: 12–16 digit | — |
| 11 | NPWP | teks (angka) | Tidak | 15 atau 16 digit | Terutama untuk pelanggan bisnis |
| 12 | Provinsi | pilihan | Ya | Dari `coverage` | Awal rantai berjenjang |
| 13 | Kabupaten/Kota | pilihan | Ya | Dari `coverage` | Aktif setelah provinsi dipilih |
| 14 | Kecamatan | pilihan | Ya | Dari `coverage` | Aktif setelah kab/kota dipilih |
| 15 | Desa/Kelurahan | pilihan | Ya | Dari `coverage` (status Tersedia) | Terisi otomatis dari `?area=<id>` |
| 16 | Alamat (Jalan, No. Rumah, RT/RW) | teks panjang | Ya | 10–255 karakter | — |
| 17 | Kode Pos | teks (angka) | Ya | Tepat 5 digit | — |
| 18 | Link Google Maps | URL | Tidak | URL Google Maps valid | Tombol "Gunakan Lokasi Saya" mengisi tautan dari koordinat perangkat (Geolocation API, diproses lokal) |
| 19 | Tanggal Registrasi | tanggal | Otomatis | — | Tanggal hari ini, read-only |
| 20 | Jenis Pelanggan | pilihan | Ya | Personal / Bisnis | — |
| 21 | Sales / Referral | pilihan | Tidak | Dari `sales` | — |
| 22 | Paket Layanan | pilihan | Ya | Dari `packages` | Terisi otomatis dari `?paket=<slug>` |
| 23 | Biaya Bulanan | teks | Otomatis | — | Dari paket terpilih; "Hubungi Kami" untuk paket custom |
| 24 | Biaya Instalasi | teks | Otomatis | — | Dari `site` |
| 25 | Kode Voucher | teks | Tidak | Alfanumerik, maks. 20 karakter | Belum divalidasi (kosmetik) |
| 26 | Kotak "Mohon Diperhatikan" | informasi | — | — | Poin S&K dari `site` (mis. PPN, perangkat dipinjamkan, biaya kabel jarak jauh, biaya pembatalan, penalti putus kontrak) |
| 27 | Persetujuan S&K & Kebijakan Privasi | checkbox | Ya | Harus dicentang | Tautan ke kedua halaman legal |
| 28 | Tanda Tangan Digital | canvas | Ya | Tidak boleh kosong | Tombol "Hapus Tanda Tangan" |

### B. Form Cek Tagihan (`/cek-tagihan`)

| # | Field | Tipe | Wajib | Validasi | Catatan |
|---|---|---|---|---|---|
| 1 | ID Pelanggan atau No. WhatsApp | teks | Ya | ID: alfanumerik 3–30 karakter; No. WA: 10–15 digit | Satu input, jenis dideteksi otomatis |

Section **Cara Pembayaran** (statis, selalu tampil): rekening tujuan (bank, nomor,
atas nama) dengan tombol "Salin", langkah pembayaran (transfer sesuai nominal →
simpan bukti → konfirmasi via WhatsApp dengan menyertakan ID pelanggan), dan tombol
"Konfirmasi via WhatsApp".

### C. Form Kirim Pesan (`/kontak`)

| # | Field | Tipe | Wajib | Validasi | Catatan |
|---|---|---|---|---|---|
| 1 | Nama | teks | Ya | 3–100 karakter | — |
| 2 | No. WhatsApp / Email | teks | Ya | Format nomor HP atau email | — |
| 3 | Subjek | pilihan | Ya | Informasi Layanan / Pemasangan Baru / Gangguan / Tagihan / Lainnya | — |
| 4 | Pesan | teks panjang | Ya | 10–1000 karakter | — |

---

## 7. Model Data Konten

Seluruh konten berada di `isp-portfolio/app/content/`, ditulis sebagai modul
TypeScript bertipe.

| File | Isi | Field Utama |
|---|---|---|
| `site.ts` | Identitas & konfigurasi situs | `brand` (nama, nama legal, tagline, deskripsi, path logo) · `contact` (WhatsApp sales, WhatsApp dukungan, telepon, email) · `address` (kantor pusat, tautan Google Maps) · `branches[]` (nama, alamat, kontak) · `hours` (jam operasional) · `social` (tautan media sosial) · `profile` (profil, visi, misi[]) · `fees` (biaya instalasi, catatan PPN) · `terms[]` (poin "Mohon Diperhatikan") · `payment` (bank, nomor rekening, atas nama, langkah[]) · `forms` (flag `daftar`, `cekTagihan`, `kontak`: `preview`/`hidden`) · `seo` (judul default, deskripsi, kata kunci lokal) |
| `packages.ts` | Kategori & paket | `categories[]`: `slug`, `title`, `description`, `icon` · `packages[]`: `slug`, `name`, `category`, `downloadMbps`, `uploadMbps`, `price` (angka Rupiah), `isCustomPrice`, `badge?`, `featured?`, `features[]`, `note?` |
| `coverage.ts` | Area layanan | `id`, `province`, `city`, `district` (kecamatan), `village` (desa/kelurahan), `status` (`tersedia` / `segera`) |
| `features.ts` | Keunggulan | `icon`, `title`, `description` |
| `stats.ts` | Angka statistik | `label`, `value`, `suffix?` — array kosong menyembunyikan section |
| `faq.ts` | Tanya-jawab | `topic`, `question`, `answer` |
| `sales.ts` | Sales/referral untuk form | `id`, `name` |
| `legal.ts` | Teks S&K dan Kebijakan Privasi | per dokumen: `updatedAt`, `sections[]` (`heading`, `paragraphs[]`) |
| `partners.ts` *(opsional)* | Logo mitra | `name`, `logo` |
| `testimonials.ts` *(opsional)* | Testimoni pelanggan | `name`, `area`, `quote` |

### Alur Pembaruan Konten

1. Edit file terkait di `isp-portfolio/app/content/` (mis. ubah harga di
   `packages.ts`, tambah desa di `coverage.ts`).
2. *(Opsional)* Jalankan `npm run build` secara lokal untuk memastikan tidak ada
   kesalahan tipe.
3. Commit & push ke branch produksi.
4. Cloudflare Pages membangun ulang dan mempublikasikan situs secara otomatis.
5. Periksa halaman terkait di situs produksi.

---

## 8. Arsitektur dan Tech Stack

### Gambaran Arsitektur

```
Pengunjung (browser)
        │  HTTPS
        ▼
Cloudflare Pages (CDN) ── file statis hasil build:
        ▲                  HTML per halaman, JS, CSS, gambar, font
        │  build otomatis setiap push
Repo git ── isp-portfolio/ (kode + app/content/*)
```

Tidak ada server aplikasi, database, maupun API. Tautan keluar hanya menuju
WhatsApp (`wa.me`), telepon (`tel:`), email (`mailto:`), media sosial, dan Google
Maps (tautan, bukan embed).

### Tech Stack

| Lapisan | Pilihan | Keterangan |
|---|---|---|
| UI | React 19 + TypeScript 6 | Sama dengan aplikasi front-end lain di repo |
| Build tool | Vite 8 | — |
| Routing & prerender | React Router 7 (≥ 7.18), *framework mode* dengan `ssr: false` + `prerender` | Setiap route di-build menjadi HTML statis; interaktivitas aktif setelah hidrasi |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) + token `@theme` | Tanpa UI kit; komponen ditulis sendiri |
| Linting | ESLint + typescript-eslint | Konfigurasi mengikuti `isp-frontend` |
| Hosting | Cloudflare Pages | Root directory `isp-portfolio`, build `npm run build`, output `build/client` |
| Runtime build | Node 22 | Ditetapkan melalui `.nvmrc` |

### Struktur Folder

```
isp-portfolio/
├── app/
│   ├── root.tsx              # kerangka HTML, meta global, header, footer, widget melayang
│   ├── routes.ts             # daftar route
│   ├── routes/               # satu file per halaman
│   ├── components/           # komponen UI & section (Button, Card, PackageCard, Modal, …)
│   ├── content/              # seluruh konten statis (Bagian 7)
│   ├── lib/                  # util: format Rupiah, validasi form, tautan WhatsApp, SEO
│   └── app.css               # @import "tailwindcss" + token @theme brand
├── public/                   # logo, favicon, OG image, font, _headers, robots.txt
├── react-router.config.ts    # ssr: false + daftar route yang di-prerender
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── package.json
├── .nvmrc
└── README.md
```

### Catatan Teknis

- **Env:** hanya `VITE_SITE_URL` (URL produksi untuk canonical, Open Graph, dan
  sitemap). Tidak ada secret di repo maupun di build.
- **Port dev:** 5174 (port 5173 dipakai `isp-frontend`).
- **Sitemap:** `sitemap.xml` dibangkitkan otomatis saat build dari daftar route.
- **404:** URL tidak dikenal dilayani halaman `404.html` berstatus HTTP 404; situs
  **tidak** memakai fallback SPA (`/* /index.html 200`).
- **Reuse:** komponen dasar dan util format Rupiah disalin lalu disesuaikan dari
  `isp-frontend` (`src/components/ui.tsx`, `src/lib/format.ts`). Repo tidak memakai
  workspaces, sehingga tidak ada shared package.
- **Opsional:** Dockerfile + nginx (pola sama dengan `isp-frontend`) sebagai
  alternatif hosting di VPS.

---

## 9. Desain & Konten

### Prinsip Desain

- **Mobile-first:** mayoritas pengunjung memakai ponsel; desain dimulai dari lebar
  360px.
- **Token brand:** warna (primer, sekunder, aksen), radius, dan font didefinisikan
  sebagai token `@theme`. Sebelum identitas brand final tersedia, dipakai palet
  placeholder netral.
- **Tipografi:** font di-host sendiri (`woff2`, tanpa Google Fonts), maksimal 2
  keluarga font, `font-display: swap`. Contoh kandidat: Plus Jakarta Sans (lisensi
  OFL).
- **Gambar:** format WebP/AVIF, ukuran responsif (`srcset`), lazy-load untuk gambar
  di bawah lipatan; gambar hero dimuat prioritas.
- **Animasi:** ringan berbasis CSS (transisi, fade-in) dan menghormati
  `prefers-reduced-motion`; tanpa library animasi/slider berat.
- **Ikon:** SVG inline/sprite, bukan font ikon.
- **Konsistensi:** tombol, kartu, badge, dan field memakai bahasa visual yang sama
  di seluruh halaman.

### Prinsip Konten

- **Orisinal:** jagonet.co.id hanya acuan struktur dan UX. Teks, gambar, ilustrasi,
  dan logo wajib orisinal atau berlisensi jelas.
- **Jujur & terverifikasi:** klaim kecepatan, SLA/uptime, jumlah pelanggan, dan area
  wajib disetujui pemilik bisnis; harga dan promo disertai label "Syarat &
  ketentuan berlaku".
- **Tanpa placeholder di produksi:** tidak ada teks contoh atau angka nol saat
  go-live; section tanpa data disembunyikan.
- **Bahasa:** Bahasa Indonesia yang ramah dan mudah dipahami; istilah teknis
  dijelaskan singkat.
- **SEO lokal:** nama kota/kecamatan layanan muncul secara alami di judul,
  deskripsi, dan isi halaman terkait.

---

## 10. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Performa** | Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 95, SEO ≥ 95. LCP ≤ 2,5 detik dan CLS ≤ 0,1 pada koneksi 4G. JavaScript awal ≤ 150 KB (gzip). |
| **SEO** | HTML statis per halaman; `<title>`, meta description, canonical, Open Graph & Twitter Card unik per halaman; JSON-LD (`Organization`/`LocalBusiness`, `Service` + `Offer`, `FAQPage`); `sitemap.xml` & `robots.txt`; halaman 404 berstatus HTTP 404. |
| **Responsif** | Lebar 360px hingga ≥ 1440px; dua versi terakhir Chrome (Android & desktop), Safari (iOS & macOS), Firefox, dan Edge. |
| **Aksesibilitas** | WCAG 2.1 AA dasar: kontras, navigasi keyboard, fokus terlihat, label input, teks alternatif, `lang="id"`, satu `h1` per halaman. |
| **Keamanan** | HTTPS wajib. Header melalui `_headers`: `Content-Security-Policy` (hanya sumber milik situs), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (`geolocation=(self)`, fitur lain dinonaktifkan), `X-Frame-Options: DENY`. Tanpa script pihak ketiga; tanpa secret di repo. |
| **Privasi** | Form tidak mengirim maupun menyimpan data; situs tidak memasang cookie; analytics (bila dipakai) wajib tanpa cookie. |
| **Ketersediaan** | Mengikuti ketersediaan Cloudflare Pages; tidak ada komponen server yang perlu dipantau. |
| **Analytics (opsional)** | Cloudflare Web Analytics (tanpa cookie) untuk statistik kunjungan; bila diaktifkan, CSP ditambah domain analytics terkait. Prospek dihitung melalui kode sumber pada pesan WhatsApp. |

---

## 11. Rencana Pengerjaan

| Fase | Nama | Deliverable Utama | Estimasi |
|---|---|---|---|
| **1** | Fondasi | Scaffold `isp-portfolio` (React Router 7 *framework mode* + prerender, Tailwind 4, ESLint, `.nvmrc`); token `@theme` placeholder; struktur `app/content/*` berisi data contoh bertipe; layout global (header + dropdown + menu mobile, footer, widget WhatsApp/telepon); proyek Cloudflare Pages + URL staging | 2 hari |
| **2** | Halaman Informasi | Beranda (10 section), Tentang Kami, Layanan & Paket, Kontak (+ form Kirim Pesan kosmetik), FAQ, Syarat & Ketentuan, Kebijakan Privasi, halaman 404 | 3 hari |
| **3** | Halaman Interaktif | Cek Coverage (pencarian di browser + widget Beranda); Form Pendaftaran lengkap (validasi, alamat berjenjang, pratinjau foto, tanda tangan, biaya otomatis); Cek Tagihan + Cara Pembayaran; banner, modal WhatsApp, flag `forms` | 3 hari |
| **4** | SEO, Performa & Go-Live | Meta/OG, JSON-LD, sitemap/robots, `_headers`, 404 berstatus HTTP 404; optimasi gambar & font; audit Lighthouse & aksesibilitas; pemasangan konten brand final; domain produksi; README panduan konten | 2 hari |

Total estimasi ± **10 hari kerja**, belum termasuk waktu penyediaan konten oleh
pemilik bisnis.

**Definisi selesai per fase:**
- **Fase 1** — staging dapat diakses dan build otomatis berjalan setiap push.
- **Fase 2** — seluruh halaman informasi tampil dengan data contoh dan lolos review
  tampilan oleh pemilik bisnis.
- **Fase 3** — AC US-06, US-07, dan US-08 terpenuhi.
- **Fase 4** — target **Bagian 10** tercapai, konten final terpasang, dan domain
  produksi aktif.

---

## 12. Roadmap Pasca-MVP

Di luar lingkup v1.0; menjadi bahan PRD berikutnya.

| Prioritas | Item | Catatan |
|---|---|---|
| 1 | Aktivasi form pendaftaran | Backend penerima data, notifikasi ke tim penjualan, dan alur tindak lanjut prospek |
| 1 | Proteksi anti-spam | Captcha (mis. Cloudflare Turnstile), honeypot, rate limit — **wajib sebelum form mana pun diaktifkan** |
| 1 | Pelindungan data pribadi | Data KTP/NIK, foto, dan tanda tangan: HTTPS, enkripsi saat disimpan, akses terbatas, masa retensi, persetujuan eksplisit, dan pembaruan Kebijakan Privasi — sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi |
| 2 | Cek tagihan fungsional | Integrasi dengan sistem penagihan ISP |
| 2 | Form Kirim Pesan fungsional | Pengiriman pesan ke email/WhatsApp tim |
| 3 | Data paket & coverage dinamis | Opsional; relevan bila perubahan data sangat sering |
| 3 | Fitur lanjutan | Peta coverage interaktif, blog/promo, testimoni yang dikelola |

---

## 13. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Form kosmetik membuat pengunjung frustrasi** (mengisi form panjang lalu tidak bisa mengirim) | Citra buruk, calon pelanggan hilang | Banner pemberitahuan di atas form; modal dengan tombol WhatsApp; flag `hidden` untuk menyembunyikan form saat go-live bila diperlukan |
| **Harga/paket basi** karena lupa build ulang | Informasi menyesatkan, komplain pelanggan | Build otomatis setiap push; panduan pembaruan 1 file di README; review konten berkala (mis. bulanan) |
| **Konten brand terlambat** | Go-live mundur | Placeholder terpusat sehingga pengembangan tidak tertahan; daftar kebutuhan konten beserta tenggatnya (**Bagian 14**) |
| **Klaim pemasaran tidak akurat** (kecepatan, SLA, jumlah pelanggan) | Risiko hukum dan hilangnya kepercayaan | Semua klaim disetujui pemilik bisnis; label "Syarat & ketentuan berlaku" |
| **Performa menurun** karena gambar/animasi berat | Peringkat SEO dan konversi turun | Anggaran ukuran aset, format WebP/AVIF, audit Lighthouse di setiap fase |
| **Pelanggaran hak cipta** (menyalin aset/teks situs referensi) | Takedown, reputasi | Seluruh aset orisinal atau berlisensi; referensi hanya dipakai untuk struktur |
| **Soft-404 / duplikasi URL** | Penilaian SEO turun | Halaman 404 berstatus HTTP 404; canonical URL; tanpa fallback SPA |
| **Nomor WhatsApp berubah/tidak aktif** | Prospek tidak tertangani | Nomor terpusat di `site.ts`; uji seluruh tautan WhatsApp di setiap rilis |
| **Data sensitif saat form diaktifkan kelak** (KTP/NIK, tanda tangan) | Kebocoran data pribadi, sanksi UU PDP | Aktivasi hanya setelah syarat anti-spam dan pelindungan data di **Bagian 12** terpenuhi |

---

## 14. Pertanyaan Terbuka & Kebutuhan Konten

| # | Item | Pemilik | Dibutuhkan Sebelum |
|---|---|---|---|
| 1 | Nama brand, nama legal perusahaan, logo (SVG), palet warna, tagline | Pemilik bisnis | Fase 4 (placeholder hingga Fase 3) |
| 2 | Domain produksi situs | Pemilik bisnis | Fase 4 |
| 3 | Alamat kantor pusat & cabang/POP, nomor WhatsApp & telepon, email, jam operasional, akun media sosial | Pemilik bisnis | Fase 2 |
| 4 | Profil perusahaan, visi & misi | Pemilik bisnis | Fase 2 |
| 5 | Daftar paket: nama, kategori, kecepatan, harga, fitur, paket unggulan | Pemilik bisnis | Fase 2 |
| 6 | Daftar area coverage (provinsi → desa/kelurahan) beserta statusnya | Pemilik bisnis / tim teknis | Fase 3 |
| 7 | Biaya instalasi, status PPN, poin S&K berlangganan (perangkat, biaya kabel, pembatalan, penalti) | Pemilik bisnis | Fase 3 |
| 8 | Rekening pembayaran (bank, nomor, atas nama) dan langkah konfirmasi | Pemilik bisnis | Fase 3 |
| 9 | Daftar sales/referral untuk form | Pemilik bisnis | Fase 3 |
| 10 | Foto/ilustrasi (kantor, tim, instalasi) | Pemilik bisnis / desainer | Fase 4 |
| 11 | Angka statistik, logo partner, testimoni (opsional) | Pemilik bisnis | Fase 4 |
| 12 | Teks final Syarat & Ketentuan dan Kebijakan Privasi | Pemilik bisnis / penasihat hukum | Fase 4 |
| 13 | Form kosmetik ditampilkan saat go-live (`preview`) atau disembunyikan (`hidden`)? | Pemilik bisnis | Fase 4 |
| 14 | Pemakaian analytics (Cloudflare Web Analytics)? | Pemilik bisnis | Fase 4 |

---

## Lampiran A — Analisis Situs Referensi (jagonet.co.id)

Hasil observasi 29 September 2026. Referensi dipakai sebatas struktur dan pola UX;
tidak ada teks maupun aset yang disalin.

### Peta Situs Referensi

- Home
- Tentang Kami ▸ Sekilas Perusahaan (visi-misi, unduh company profile), Galeri,
  Team Works, Cabang (POP / Partner / Mitra)
- Produk & Layanan ▸ Layanan Internet (tier Home/School/Business + paket broadband,
  toggle bulanan/tahunan), halaman per lini produk
- Cek Coverage — daftar 5 kota statis, tanpa pencarian
- Tools ▸ MRTG, Speedtest (subdomain terpisah)
- Kontak Kami — nomor admin & NOC, email, alamat, form "Kirim Pesan"
- CTA "Daftar" → form di subdomain terpisah

### Urutan Section Beranda Referensi

1. Carousel peta jangkauan layanan per kota + widget melayang Sales (telepon &
   WhatsApp)
2. Hero: headline, sub-headline, CTA "Berlangganan", ilustrasi
3. Kartu lini layanan
4. Blok layanan internet dedicated + CTA "Hubungi Kami"
5. Empat keunggulan (kecepatan, SLA, monitoring, dukungan 24/7)
6. Counter angka (tim ahli, klien, mitra, proyek)
7. Banner internet bisnis
8. Paket & harga: kartu dengan badge (Most Popular / Premium), harga per bulan,
   daftar fitur, tombol berlangganan, catatan S&K
9. CTA cek ketersediaan jaringan
10. Logo partner
11. Footer: kantor pusat, kontak, cabang, tautan kebijakan, media sosial

### Field Form Pendaftaran Referensi

Foto KTP/rumah; nama, email, nomor HP, jenis kelamin, tanggal & kota lahir, jenis &
nomor identitas, NPWP; alamat berjenjang (provinsi → kab/kota → kecamatan → desa),
jalan & nomor rumah, kode pos, tautan Google Maps; tanggal registrasi, jenis
pelanggan, sales; layanan per lokasi, biaya instalasi, biaya bulanan, voucher; kotak
ketentuan (PPN, modem dipinjamkan, biaya instalasi, biaya kabel jarak jauh, biaya
pembatalan, penalti putus kontrak); persetujuan S&K; tanda tangan digital.

### Yang Diadopsi vs Diperbaiki

| Aspek | Referensi | isp-portfolio |
|---|---|---|
| Struktur navigasi & section | Lengkap dan familiar bagi calon pelanggan ISP | **Diadopsi**, disederhanakan |
| Kartu paket | Badge, harga, fitur, CTA | **Diadopsi**; data dari satu file konten |
| Widget WhatsApp/telepon | Ada | **Diadopsi**, ditambah kode sumber pesan |
| Kelengkapan form daftar | Sangat lengkap | **Diadopsi** (kosmetik di v1.0) |
| Teknologi | Campuran Bootstrap + Bulma + jQuery, ± 28 file script, sebagian dimuat dari domain pihak lain | React + prerender, tanpa script pihak ketiga |
| Cek coverage | Hanya daftar kota | Pencarian hingga tingkat desa + CTA sesuai status |
| Kualitas konten | Teks placeholder tertinggal; counter bernilai "0" di HTML | Tanpa placeholder; angka sudah di HTML; section kosong disembunyikan |
| SEO | Meta dasar | Meta/OG per halaman, JSON-LD, sitemap, canonical |
| Form daftar | Di subdomain terpisah | Menyatu di situs dengan gaya yang konsisten |

---

## Lampiran B — Glosarium

| Istilah | Arti |
|---|---|
| **Prerender** | Proses membangkitkan HTML setiap halaman saat build, sehingga halaman langsung berisi konten tanpa menunggu JavaScript |
| **Build ulang** | Menjalankan ulang proses build untuk menghasilkan file statis versi baru setelah konten berubah |
| **Hidrasi** | Proses React mengaktifkan interaktivitas pada HTML hasil prerender |
| **Coverage** | Area yang sudah (atau akan) terjangkau jaringan ISP |
| **Form kosmetik / pratinjau** | Form yang tampil dan dapat diisi lengkap, namun belum mengirim maupun menyimpan data |
| **Feature flag** | Pengaturan di `site.ts` untuk menampilkan (`preview`) atau menyembunyikan (`hidden`) suatu form |
| **CTA (Call to Action)** | Tombol/tautan ajakan, mis. "Berlangganan" atau "Cek Coverage" |
| **Kode sumber pesan** | Kode singkat pada pesan WhatsApp otomatis (mis. `[WEB-PAKET]`) untuk mengetahui asal prospek |
| **JSON-LD** | Format data terstruktur yang membantu mesin pencari memahami isi halaman |
| **POP (Point of Presence)** | Titik lokasi jaringan/cabang ISP |
| **Soft-404** | Halaman "tidak ditemukan" yang keliru dikirim dengan status HTTP 200 sehingga merugikan SEO |

---

*— Akhir dokumen —*
