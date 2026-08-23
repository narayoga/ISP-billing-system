# Product Requirements Document (PRD)

**Nama Proyek:** Sistem Manajemen Terintegrasi ISP
**Versi:** 3.0
**Tanggal:** 20 Agustus 2026
**Status:** Approved for Build — revisi akses pelanggan & kanal notifikasi
**Menggantikan:** PRD versi 2.0 (15 Mei 2026)

> **Ringkasan perubahan dari v2.0:** portal pelanggan berbasis login dihapus dan
> diganti **halaman tagihan publik dengan tautan bertoken per invoice** (tanpa
> password). Kanal notifikasi utama berpindah dari in-app ke **WhatsApp (Wablas)**
> dengan email dipertahankan sebagai pendamping. Rincian lengkap di **Lampiran B**.

---

## 1. Ruang Lingkup dan Tujuan

### Ringkasan Eksekutif

Dalam fase awal peluncuran Internet Service Provider (ISP) baru, prioritas utama
adalah memastikan kelancaran operasional dasar: manajemen pelanggan, kelancaran
siklus penagihan, dan keandalan jaringan.

Versi 3.0 mengoreksi satu asumsi penting dari v2.0: memaksa pelanggan membuat akun
dan login hanya untuk mengecek status tagihan adalah friksi yang tidak sepadan
dengan frekuensi pemakaiannya (sebulan sekali). Password yang terlupa justru
menambah beban Customer Service. Sebagai gantinya, sistem mengirim **tautan unik
per tagihan** melalui WhatsApp dan email; pelanggan cukup mengklik untuk melihat
tagihan dan mengunggah bukti transfer — pola yang lazim dipakai layanan invoice
modern (Stripe, Xendit, Midtrans).

### Tujuan Utama (Objective)

Membangun ekosistem sistem informasi terintegrasi untuk ISP guna mengotomatisasi
penagihan bulanan, mengelola data pelanggan secara efisien, memantau status
jaringan pelanggan secara real-time, dan menyampaikan informasi tagihan melalui
kanal yang benar-benar dibaca pelanggan.

### Ruang Lingkup (In-Scope)

**A. Akses Pelanggan (Tanpa Login)**
- Halaman tagihan publik yang diakses via tautan bertoken unik per invoice.
- Melihat rincian tagihan berjalan (nominal, jatuh tempo) dan riwayat 3 bulan.
- Melihat informasi rekening tujuan transfer.
- Mengunggah bukti pembayaran transfer manual.
- Melihat informasi layanan aktif (kecepatan, kuota/FUP).
- **Tidak ada** pendaftaran akun, password, maupun proses login.

**B. Dashboard Admin (Admin Panel)**
- Login admin dengan JWT + RBAC (superadmin, cs) — hanya untuk staf internal.
- Manajemen Data Pelanggan (CRUD: pendaftaran, pembaruan, penonaktifan).
- Manajemen Paket Internet (CRUD).
- Manajemen Tagihan dan verifikasi pembayaran (Approve/Reject).
- Kirim ulang tautan tagihan ke pelanggan.
- Indikator pemantauan status jaringan pelanggan (real-time).
- Audit log untuk aksi penting.

**C. Pemantauan Jaringan & Automasi (Network Integration)**
- Integrasi Mikrotik via RouterOS API.
- Pemantauan status koneksi (Online/Offline) per pelanggan.
- Automasi isolir koneksi (disable PPPoE secret) berdasarkan status pembayaran.
- Antrian eksekusi ulang bila perangkat jaringan tidak terjangkau.

**D. Notifikasi**
- **WhatsApp via Wablas** — kanal utama.
- **Email (SMTP)** — kanal pendamping/arsip, dikirim bersamaan.
- Setiap notifikasi tagihan menyertakan tautan bertoken ke halaman tagihan.

### Di Luar Ruang Lingkup (Out-of-Scope)

Ditangguhkan untuk fase pengembangan selanjutnya:
- Aplikasi Mobile Native (Android/iOS).
- Sistem Ticketing / Helpdesk kompleks (saat ini via WhatsApp/telepon).
- Pemetaan topologi jaringan berbasis GIS.
- Payment Gateway otomatis (saat ini transfer manual + unggah bukti).
- Realtime push via WebSocket/SSE (memakai polling 5 detik).
- Portal pelanggan berbasis akun/login beserta riwayat transaksi mandiri.

---

## 2. Aktor Pengguna (User Roles)

| Aktor | Deskripsi | Cara Mengakses Sistem |
|---|---|---|
| **Pelanggan (Customer)** | Pelanggan layanan internet. Berinteraksi saat menerima tagihan dan mengunggah bukti bayar. | Tautan bertoken via WhatsApp/email — **tanpa akun** |
| **Admin / Customer Service** | Staf internal ISP (role: `superadmin` / `cs`). Mengelola data operasional, memvalidasi pembayaran, memantau layanan. | Dashboard admin, login JWT |
| **Sistem Jaringan (Mikrotik)** | Aktor non-manusia. Mengirim log status koneksi ke webhook, menerima perintah isolir/buka akses. | Webhook (shared secret) + RouterOS API |

---

## 3. User Stories

### A. Modul Penagihan & Akses Pelanggan

**US-01 — Melihat Rincian dan Riwayat Tagihan**
Sebagai pelanggan, saya ingin membuka tautan yang dikirim ke WhatsApp/email saya
dan langsung melihat rincian tagihan bulan ini (nominal, tenggat) serta riwayat
3 bulan terakhir, **tanpa perlu login**, sehingga saya tahu persis kewajiban saya
tanpa hambatan.

**US-02 — Mengunggah Bukti Transfer**
Sebagai pelanggan, saya ingin mengunggah bukti transfer langsung dari halaman
tagihan tersebut, sehingga admin dapat segera memproses dan mengaktifkan kembali
layanan saya jika terisolir.

**US-03 — Automasi Isolir Koneksi**
Sebagai sistem jaringan, saya ingin melakukan pengecekan status pembayaran setiap
hari pukul 00:01 dan mengisolasi koneksi pelanggan yang menunggak lebih dari 3 hari
setelah jatuh tempo (mulai tanggal 24), sehingga perusahaan meminimalisir kebocoran
bandwidth.

**US-04 — Generate Tagihan Massal**
Sebagai admin, saya ingin tagihan massal di-generate otomatis untuk seluruh
pelanggan aktif pada tanggal 1 setiap bulan (dengan opsi trigger manual satu klik),
sehingga menghemat waktu administratif.

**US-05 — Verifikasi Pembayaran**
Sebagai admin, saya ingin melihat daftar pembayaran tertunda dan memiliki tombol
Approve/Reject pada bukti transfer yang diunggah pelanggan, sehingga saya bisa
memvalidasi pembayaran dan mengaktifkan layanan secara akurat.

### B. Modul Pemantauan Jaringan

**US-06 — Indikator Status Koneksi**
Sebagai admin, saya ingin melihat indikator warna (Hijau online, Merah offline,
Abu-abu unknown) untuk status koneksi setiap pelanggan di dashboard, sehingga saya
bisa proaktif memantau dan menghubungi pelanggan bila ada gangguan.

**US-07 — Webhook Status Jaringan**
Sebagai sistem jaringan, saya ingin mengirim webhook (diamankan shared secret)
setiap kali status koneksi router pelanggan berubah (alive/rto), sehingga status
di dashboard admin diperbarui mendekati real-time.

### C. Modul Manajemen Data

**US-08 — Tambah Data Pelanggan**
Sebagai admin, saya ingin menambahkan data pelanggan baru (Nama, Alamat, **Nomor
WhatsApp**, Email, Paket Internet, IP/MAC Address, PPPoE username), sehingga
pelanggan dapat di-provisioning ke jaringan dan menerima notifikasi tagihan.

### D. Modul Akses & Operasional Pendukung

**US-09 — Akses Tagihan via Tautan Bertoken** *(menggantikan "Onboarding via Magic Link" v2.0)*
Sebagai pelanggan, saya ingin menerima tautan unik untuk setiap tagihan saya,
sehingga saya bisa langsung melihat dan membayar tagihan tanpa membuat akun atau
mengingat password.

**US-10 — Kirim Ulang Tautan Tagihan** *(menggantikan "Kirim Ulang Magic Link" v2.0)*
Sebagai admin, saya ingin tombol "Kirim Ulang Tautan Tagihan" di halaman detail
pelanggan atau tagihan, sehingga saya bisa mengirim ulang bila pesan tidak sampai
atau token sudah kedaluwarsa.

**US-11 — Audit Log**
Sebagai superadmin, saya ingin melihat audit log untuk aksi penting (approve/reject
pembayaran, isolir manual, perubahan paket, login admin, kirim ulang tautan),
sehingga setiap perubahan operasional dapat ditelusuri.

**US-12 — Notifikasi Multi-Kanal** *(baru di v3.0)*
Sebagai pelanggan, saya ingin menerima notifikasi tagihan melalui WhatsApp (kanal
utama) dan email (pendamping), sehingga informasi tagihan sampai melalui kanal yang
benar-benar saya baca sehari-hari.

---

## 4. Acceptance Criteria

### US-01 (Melihat Rincian dan Riwayat Tagihan)
- **AC 1:** Membuka tautan bertoken menampilkan rincian tagihan (nominal, tenggat, periode) **tanpa proses login**.
- **AC 2:** Halaman menampilkan riwayat status pembayaran 3 bulan terakhir (Lunas, Menunggu Verifikasi, Unpaid/Overdue).
- **AC 3:** Halaman menampilkan informasi rekening tujuan transfer dan informasi layanan aktif (kecepatan, kuota/FUP).
- **AC 4:** Status tagihan diperbarui setelah pembayaran diverifikasi admin (US-05).
- **AC 5:** Token tidak valid / kedaluwarsa menampilkan pesan jelas: "Tautan tidak berlaku. Hubungi admin untuk meminta tautan baru."

### US-02 (Mengunggah Bukti Transfer)
- **AC 1:** Sistem hanya menerima file `.jpg`, `.png`, `.pdf`.
- **AC 2:** Ukuran file maksimal 2MB; melebihi batas menampilkan pesan "File terlalu besar".
- **AC 3:** File disimpan di disk via Docker volume; path disimpan di kolom `proof_path`.
- **AC 4:** Setelah unggah berhasil, status tagihan otomatis menjadi "Menunggu Verifikasi".
- **AC 5:** Endpoint unggah bersifat publik (tanpa autentikasi user), sehingga **wajib** dilindungi rate limit dan validasi tipe/ukuran file.

### US-03 (Automasi Isolir Koneksi)
- **AC 1:** Cron berjalan setiap hari pukul 00:01. Jika tanggal ≥ 24 dan tagihan bulan berjalan masih Unpaid/Overdue, sistem memanggil Mikrotik API untuk disable PPPoE secret.
- **AC 2:** Setelah berhasil di-disable, status pelanggan menjadi "Terisolir" dan dicatat ke `audit_log`.
- **AC 3:** Bila admin menyetujui pembayaran (US-05), sistem otomatis enable kembali PPPoE secret dalam waktu maksimal 5 menit.
- **AC 4:** Sistem melakukan retry maksimal 3x bila panggilan Mikrotik API gagal, dengan exponential backoff.
- **AC 5:** Bila tetap gagal, operasi masuk **antrian tertunda** untuk dieksekusi ulang berkala; setelah batas percobaan terlampaui, sistem mengirim alert ke admin.

### US-04 (Generate Tagihan Massal)
- **AC 1:** Hanya admin dengan role `superadmin` yang dapat mengakses tombol Generate Tagihan Massal manual.
- **AC 2:** Cron otomatis berjalan tanggal 1 pukul 00:00 untuk pelanggan dengan status Aktif, Menunggak, atau Terisolir.
- **AC 3:** Tanggal jatuh tempo default setiap invoice adalah tanggal 20 bulan terbit.
- **AC 4:** Status awal semua tagihan baru adalah "Unpaid".
- **AC 5:** Sistem menerbitkan **token akses unik untuk setiap invoice** yang dibuat.
- **AC 6:** Notifikasi tagihan terbit (WhatsApp + email) berisi tautan bertoken dikirim ke seluruh pelanggan penerima invoice.
- **AC 7:** Sistem mencegah duplikasi: bila invoice bulan berjalan sudah ada untuk seorang pelanggan, tidak digenerate ulang.

### US-05 (Verifikasi Pembayaran oleh Admin)
- **AC 1:** Admin dapat melihat bukti transfer dalam pop-up viewer (gambar inline, PDF embedded).
- **AC 2:** Tombol Approve mengubah status tagihan menjadi "Lunas" dan memicu pembukaan isolir bila pelanggan terisolir dan seluruh tunggakannya telah lunas.
- **AC 3:** Tombol Reject mengubah status tagihan kembali menjadi "Unpaid" dan mengirim notifikasi (WhatsApp + email) berisi tautan untuk unggah ulang.
- **AC 4:** Setiap aksi Approve/Reject dicatat ke `audit_log` dengan timestamp & admin pelaksana.
- **AC 5:** Approve mengirim notifikasi konfirmasi pembayaran diterima ke pelanggan.

### US-06 (Indikator Status Koneksi)
- **AC 1:** Dashboard admin menampilkan indikator warna (Hijau = Online, Merah = Offline, Abu-abu = Unknown) di samping nama pelanggan.
- **AC 2:** Dashboard melakukan polling endpoint status setiap 5 detik; indikator diperbarui maksimal 10 detik setelah perubahan diterima dari Mikrotik.
- **AC 3:** Status dibaca dari Redis (TTL 60 detik). Bila key tidak ditemukan, status ditampilkan sebagai Unknown.

### US-07 (Webhook Status Jaringan)
- **AC 1:** Sistem menyediakan endpoint `POST /webhook/network-status` yang diamankan header `X-Webhook-Secret`.
- **AC 2:** Payload wajib memuat identitas pelanggan (IP / MAC / PPPoE username) dan status (`alive` | `rto`).
- **AC 3:** Setiap event ditulis ke Redis dengan key `network_status:{customer_id}` dan TTL 60 detik, serta dicerminkan ke tabel `network_status`.
- **AC 4:** Request dengan secret invalid ditolak dengan HTTP 401 dan tidak diproses.
- **AC 5:** Webhook `alive` pertama untuk pelanggan berstatus "Pending Provisioning" mengubah statusnya menjadi "Aktif".

### US-08 (Tambah Data Pelanggan Baru)
- **AC 1:** Admin wajib mengisi mandatory fields: Nama, Alamat, **Nomor WhatsApp**, Paket Internet, PPPoE username.
- **AC 2:** Email bersifat opsional namun disarankan (kanal pendamping); bila diisi harus unik.
- **AC 3:** Nomor WhatsApp wajib, disimpan dalam format internasional (mis. `628xxxxxxxxxx`), dan divalidasi formatnya.
- **AC 4:** PPPoE username harus unik di tabel `customers`.
- **AC 5:** Status awal pelanggan adalah "Pending Provisioning" sampai webhook pertama diterima.

### US-09 (Akses Tagihan via Tautan Bertoken)
- **AC 1:** Setiap invoice memiliki token akses unik (acak, tidak dapat ditebak maupun diurutkan).
- **AC 2:** Token dibuat otomatis saat invoice diterbitkan (cron maupun manual).
- **AC 3:** Token berlaku hingga **90 hari** sejak diterbitkan dan dapat dipakai berulang kali selama masa berlaku.
- **AC 4:** Satu token hanya memberi akses ke **satu invoice** milik pelanggan tersebut beserta ringkasan riwayat 3 bulan — tidak memberi akses ke data pelanggan lain.
- **AC 5:** Token yang kedaluwarsa/dicabut menampilkan pesan jelas beserta instruksi menghubungi admin.

### US-10 (Kirim Ulang Tautan Tagihan)
- **AC 1:** Tombol "Kirim Ulang Tautan" tersedia di halaman detail tagihan/pelanggan untuk admin.
- **AC 2:** Klik tombol menerbitkan token baru (memperpanjang masa berlaku) dan mengirim ulang pesan via WhatsApp + email.
- **AC 3:** Aksi kirim ulang dicatat ke `audit_log` dengan timestamp & admin pelaksana.

### US-11 (Audit Log)
- **AC 1:** Aksi yang dicatat: login admin, generate tagihan massal, approve/reject pembayaran, isolir manual, buka isolir manual, perubahan paket, kirim ulang tautan, kegagalan job jaringan.
- **AC 2:** Entri memuat: timestamp, `admin_id`, aksi, entitas terkait, dan payload ringkas.
- **AC 3:** Audit log bersifat read-only dan hanya dapat dilihat oleh role `superadmin`.

### US-12 (Notifikasi Multi-Kanal)
- **AC 1:** Setiap notifikasi pelanggan dikirim ke WhatsApp (via Wablas) **dan** email bila alamat email tersedia.
- **AC 2:** Kegagalan salah satu kanal tidak menggagalkan kanal lain maupun proses bisnis yang memicunya (best-effort, dicatat di log).
- **AC 3:** Pesan WhatsApp memuat: nama pelanggan, periode, nominal, jatuh tempo, dan tautan tagihan.
- **AC 4:** Provider WhatsApp bersifat dapat ditukar (abstraksi provider), sehingga perpindahan dari Wablas ke WhatsApp Business API resmi tidak mengubah logika bisnis.

---

## 5. Arsitektur dan Tech Stack

Arsitektur Service-Oriented dengan **3 repository terpisah (polyrepo)**. Backend
hybrid: Go untuk komponen berperforma tinggi & integrasi jaringan, Node.js untuk
operasional CRUD.

### Frontend (Client-Side)
- **Framework:** React 19 + TypeScript, Vite, React Router
- **Styling:** Tailwind CSS v4
- **Data fetching:** `fetch` + React Context/hooks (tanpa library state eksternal)
- **Struktur:** satu aplikasi berisi **dashboard admin** (`/admin/*`, terlindungi
  JWT) dan **halaman tagihan publik** (`/tagihan/:token`, tanpa autentikasi),
  di-*lazy load* terpisah sehingga bundle admin tidak diunduh pelanggan.

### Backend — Hybrid

**Layanan Inti & Automasi (Golang) — `isp-billing-service`**
- Generate tagihan massal (cron tanggal 1) + penerbitan token akses invoice.
- Cron isolir otomatis (tanggal 24), penanda overdue, reminder H-3 & jatuh tempo.
- Integrasi Mikrotik RouterOS API (disable/enable PPPoE secret).
- Endpoint webhook penerima status jaringan.
- Antrian & worker eksekusi ulang operasi jaringan yang gagal.
- **Owner skema database** (golang-migrate).

**Layanan Operasional (Node.js/Express) — `isp-api-service`**
- CRUD pelanggan, paket internet, manajemen tagihan & pembayaran.
- Autentikasi JWT admin + RBAC; rate limiting.
- Endpoint publik bertoken untuk halaman tagihan & unggah bukti.
- Pengiriman notifikasi (WhatsApp + email).
- **Konsumen skema DB** (tidak menjalankan migrasi).

### Database & Infrastruktur
- **Database:** PostgreSQL 18
- **Cache / Realtime:** Redis 7 (status koneksi, TTL 60s)
- **Network API:** Mikrotik RouterOS API (PPPoE secret enable/disable)
- **File Storage:** disk via Docker volume (`/var/lib/isp/uploads`)
- **Email:** SMTP (Gmail/SendGrid) di produksi; MailHog di dev
- **WhatsApp:** **Wablas** (HTTP API), di balik abstraksi provider
- **Deployment:** Docker + Docker Compose (image per service, reverse proxy nginx)
- **Kontrak BE↔FE:** OpenAPI 3.1 YAML sebagai source of truth

---

## 6. Siklus Billing (Business Rules)

| Tanggal | Event | Sistem Bertindak |
|---|---|---|
| **1** (00:00) | Generate massal | Cron membuat invoice untuk semua pelanggan billable, status Unpaid, due date tgl 20, **+ terbitkan token akses** |
| **1** | Notifikasi terbit | WhatsApp + email: "Tagihan bulan ini telah terbit" **+ tautan tagihan** |
| **17** | Reminder H-3 | WhatsApp + email: "Tagihan jatuh tempo dalam 3 hari" + tautan |
| **20** | Jatuh tempo | Reminder final; status invoice masih Unpaid |
| **21** | Mulai overdue | Status invoice → Overdue; pelanggan → **Menunggak** |
| **24** (00:01) | Isolir otomatis | Cron memanggil Mikrotik API disable PPPoE untuk seluruh invoice Unpaid/Overdue; notifikasi isolir + tautan |
| Kapan saja | Approve pembayaran | Status → Lunas; bila seluruh tunggakan lunas dan pelanggan terisolir, enable PPPoE dalam ≤5 menit; kirim notifikasi konfirmasi |

**Aturan tambahan:**
- Tagihan tetap digenerate bulan berikutnya walaupun bulan sebelumnya menunggak (multi-invoice outstanding diperbolehkan).
- Pembukaan isolir hanya terjadi bila **seluruh** invoice Unpaid/Overdue/Menunggu Verifikasi pelanggan tersebut sudah Lunas.
- Status pelanggan terkomputasi dari relasi invoice + state jaringan: Aktif, Pending Provisioning, Menunggak, Terisolir, Non-aktif.
- Operasi jaringan yang gagal tidak hilang — masuk antrian dan dicoba ulang otomatis.

---

## 7. Arsitektur Repository & Skema Database

### Struktur 3 Repository (Polyrepo)

| Repo | Stack | Tanggung Jawab |
|---|---|---|
| `isp-frontend` | React + TS + Tailwind | Dashboard admin + halaman tagihan publik |
| `isp-billing-service` | Go | Billing, Mikrotik, webhook, cron, antrian job, migrasi DB |
| `isp-api-service` | Node.js + Express | CRUD, auth admin, endpoint publik bertoken, unggah, notifikasi |

> Repo orkestrasi (opsional) menampung `docker-compose*.yml`, konfigurasi nginx,
> dan dokumen seperti PRD ini.

### Skema Database (Tabel Utama)

| Tabel | Isi |
|---|---|
| `customers` | Data pelanggan (nama, alamat, **phone**, email, `package_id`, `pppoe_username`, ip/mac, status) |
| `packages` | Paket internet (nama, harga, `speed_mbps`, `quota_gb`, `fup_mbps`) |
| `invoices` | Tagihan (`customer_id`, period, amount, `due_date`, status) |
| `invoice_access_tokens` | **Baru** — token akses publik per invoice (token, `invoice_id`, `expires_at`, `revoked_at`) |
| `payments` | Pembayaran (`invoice_id`, `proof_path`, `uploaded_at`, `verified_by`, `verified_at`, status, `reject_reason`) |
| `admin_users` | Akun admin (email, `password_hash`, role) |
| `network_status` | Snapshot status terakhir per pelanggan (cermin Redis untuk historis) |
| `network_jobs` | **Baru** — antrian operasi jaringan tertunda (action, status, attempts, `next_retry_at`) |
| `audit_log` | Log aksi penting (`admin_id`, action, entity, payload, timestamp) |

**Catatan perubahan skema dari v2.0:**
- `customers.phone` — kolom baru, **wajib** (kanal WhatsApp).
- `customers.password_hash` — **tidak lagi digunakan** (pelanggan tidak punya akun).
- `password_reset_tokens` — tidak lagi dipakai untuk onboarding pelanggan.

---

## 8. Notifikasi

| Event | WhatsApp | Email | Menyertakan Tautan |
|---|---|---|---|
| Tagihan bulan ini terbit | Ya | Ya | Ya |
| Reminder H-3 jatuh tempo | Ya | Ya | Ya |
| Jatuh tempo (tgl 20) | Ya | Ya | Ya |
| Mulai terisolir (tgl 24) | Ya | Ya | Ya |
| Bukti transfer disetujui (Lunas) | Ya | Ya | Ya |
| Bukti transfer ditolak (unggah ulang) | Ya | Ya | Ya |
| Kirim ulang tautan tagihan | Ya | Ya | Ya |
| Alert operasional (job jaringan gagal) | — | Ya (ke admin) | — |

**Prinsip:** WhatsApp adalah kanal utama karena tingkat keterbacaannya jauh lebih
tinggi pada segmen pelanggan sasaran; email berfungsi sebagai pendamping dan arsip.
Kegagalan pengiriman notifikasi tidak boleh menggagalkan transaksi bisnis yang
memicunya.

---

## 9. Rencana Pengerjaan

### Status Fase v2.0 (Selesai)

| Fase | Nama | Status |
|---|---|---|
| 0 | Foundation | Selesai |
| 1 | DB & Auth | Selesai |
| 2 | CRUD Admin | Selesai |
| 3 | Billing Engine | Selesai |
| 4 | Portal Pelanggan (login) | Selesai — **direvisi di Fase 9** |
| 5 | Verifikasi Pembayaran | Selesai |
| 6 | Integrasi Mikrotik | Selesai (mock; perangkat nyata belum diuji) |
| 7 | Network Monitoring | Selesai |
| 8 | Polish & Handover | Selesai |

### Fase Baru v3.0

| Fase | Nama | Deliverable Utama | Estimasi |
|---|---|---|---|
| **9** | Akses Tagihan Bertoken | Migrasi `invoice_access_tokens`; endpoint publik bertoken; halaman `/tagihan/:token`; hapus login & landing pelanggan; rate limit endpoint publik | 3 hari |
| **10** | Kanal WhatsApp | Migrasi `customers.phone`; provider Wablas + abstraksi; fan-out notifikasi WA + email; field nomor WA di form admin | 3 hari |
| **11** | Integrasi Mikrotik Nyata | Uji RouterOS API ke perangkat fisik; skrip netwatch pengirim webhook; validasi isolir/reaktivasi end-to-end | 3 hari |
| **12** | Deployment Produksi | Reverse proxy nginx + TLS; secret produksi; backup DB; monitoring & log | 3 hari |

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Tautan tagihan tersebar** (diteruskan/di-screenshot) | Pihak lain dapat melihat tagihan tersebut | Token acak panjang & tidak berurutan; berlaku terbatas (90 hari); cakupan hanya 1 invoice; dapat dicabut dan diterbitkan ulang oleh admin |
| **Nomor WhatsApp diblokir Meta** (Wablas tidak resmi) | Notifikasi utama berhenti | Abstraksi provider agar mudah pindah ke WhatsApp Business API resmi; email tetap aktif sebagai pendamping; hindari pola pengiriman menyerupai spam |
| **Endpoint publik disalahgunakan** (unggah sampah / tebak token) | Beban server, storage penuh | Rate limit per IP; validasi tipe & ukuran file; token tidak dapat ditebak; monitoring volume unggahan |
| **Nomor WA salah/tidak aktif** | Pelanggan tidak menerima tagihan | Validasi format saat input; laporan kegagalan kirim; email pendamping; admin dapat kirim ulang |
| Mikrotik unreachable saat isolir/buka | Pelanggan tidak terisolir / tidak terbuka tepat waktu | Retry 3x exponential backoff, antrian tertunda dengan worker berkala, alert ke admin bila menyerah |
| Polling 5 detik tidak skalabel di >1000 pelanggan | Beban server tinggi | Roadmap: migrasi ke SSE; cache Redis sudah meringankan |
| Inkonsistensi skema antar 2 backend | Bug subtle Node vs Go | Skema dimiliki 1 service (Go + golang-migrate); Node hanya konsumen |
| Bukti transfer hilang saat container restart | Data pembayaran hilang | Docker volume terpisah dari container; roadmap MinIO/S3 |
| Password admin lemah / leak | Akses dashboard tidak sah | Bcrypt cost 12, rate limit login, audit log login admin |

---

## Lampiran A — Glosarium Status

| Entitas | Status | Arti |
|---|---|---|
| Invoice | Unpaid | Tagihan terbit, belum dibayar / belum unggah bukti |
| Invoice | Menunggu Verifikasi | Pelanggan sudah unggah bukti, menunggu approve admin |
| Invoice | Lunas | Pembayaran disetujui admin |
| Invoice | Overdue | Lewat jatuh tempo (tgl 21+) tapi belum isolir |
| Pelanggan | Pending Provisioning | Dibuat admin, menunggu webhook pertama dari Mikrotik |
| Pelanggan | Aktif | Online normal, tidak ada tunggakan |
| Pelanggan | Menunggak | Punya invoice Overdue tapi belum terisolir |
| Pelanggan | Terisolir | PPPoE secret di-disable karena menunggak |
| Pelanggan | Non-aktif | Penonaktifan permanen oleh admin |
| Koneksi | Online | Webhook terakhir = alive, dalam TTL 60s |
| Koneksi | Offline | Webhook terakhir = rto, dalam TTL 60s |
| Koneksi | Unknown | Tidak ada data di Redis (TTL habis) |
| Job Jaringan | pending | Menunggu dieksekusi ulang |
| Job Jaringan | done | Berhasil dieksekusi |
| Job Jaringan | failed | Menyerah setelah batas percobaan; admin di-alert |

---

## Lampiran B — Perubahan dari Versi 2.0

### Perubahan Utama

| # | Aspek | v2.0 | v3.0 |
|---|---|---|---|
| 1 | Akses pelanggan | Portal dengan login (email + password) | **Tautan bertoken per invoice, tanpa login** |
| 2 | Onboarding pelanggan | Magic link untuk set password | **Tidak ada** — pelanggan tidak punya akun |
| 3 | Kanal notifikasi utama | In-app banner + email | **WhatsApp (Wablas) + email** |
| 4 | Nomor WhatsApp | Tidak ada | **Wajib** (`customers.phone`) |
| 5 | Struktur frontend | 2 aplikasi terpisah, 2 subdomain | **1 aplikasi**: admin + halaman tagihan publik |
| 6 | Halaman landing pemilih portal | Ada di implementasi v2.0 | **Dihapus** |
| 7 | Jumlah repository | 4 | **3** |
| 8 | State management FE | TanStack Query + Zustand | `fetch` + React Context/hooks |
| 9 | Kegagalan Mikrotik | Retry 3x | Retry 3x **+ antrian tertunda + alert admin** |
| 10 | Status pelanggan "Menunggak" | Didefinisikan namun tak diterapkan | **Diterapkan** (otomatis saat invoice overdue) |

### User Story yang Berubah

- **US-09** — "Onboarding via Magic Link" → **"Akses Tagihan via Tautan Bertoken"**
- **US-10** — "Kirim Ulang Magic Link" → **"Kirim Ulang Tautan Tagihan"**
- **US-12** — **baru**: Notifikasi Multi-Kanal (WhatsApp + Email)
- **US-01, US-02, US-08** — direvisi (akses tanpa login; nomor WA wajib)

### Alasan Perubahan

Memaksa pelanggan membuat akun dan mengingat password untuk aktivitas yang hanya
terjadi sebulan sekali menimbulkan friksi tinggi dengan manfaat rendah, dan
memindahkan beban ke Customer Service saat password terlupa. Pola tautan bertoken
menghapus friksi tersebut tanpa mengorbankan alur unggah bukti yang terstruktur.
Perpindahan kanal utama ke WhatsApp mengikuti kebiasaan nyata segmen pelanggan
sasaran, di mana tingkat keterbacaan email relatif rendah.

---

*— Akhir dokumen —*
