# Product Requirements Document (PRD)

**Nama Proyek:** Sistem Manajemen Terintegrasi ISP
**Versi:** 4.0
**Tanggal:** 8 Oktober 2026
**Status:** Draft — menunggu persetujuan
**Menggantikan:** PRD versi 3.0 (20 Agustus 2026)

> **Ringkasan perubahan dari v3.0:** pembayaran berpindah dari transfer manual +
> unggah bukti ke **Virtual Account melalui Xendit**, sehingga layanan **terbuka
> otomatis begitu pelanggan membayar** tanpa campur tangan admin. Isolir residensial
> berubah dari memutus akun PPPoE menjadi **soft isolir** (profil isolir + halaman
> isolir), dan pelanggan **enterprise** mendapat kebijakan isolir tersendiri.
> Aplikasi diposisikan sebagai **MVP untuk diajukan ke ISP**. Rincian di **Lampiran B**.

---

## 1. Ruang Lingkup dan Tujuan

### Ringkasan Eksekutif

Sistem ini adalah MVP manajemen pelanggan dan penagihan untuk ISP skala kecil–menengah
yang memakai router MikroTik dengan PPPoE. MVP disiapkan untuk diajukan kepada ISP
yang membutuhkan; setiap ISP memakai akun Xendit, router, dan kanal notifikasi
miliknya sendiri melalui konfigurasi.

Versi 4.0 menutup dua kelemahan operasional v3.0 yang teridentifikasi dari riset
praktik ISP menengah:

1. **Pembukaan isolir bergantung pada admin.** Pelanggan yang membayar malam hari
   tetap terisolir hingga admin memverifikasi bukti transfer keesokan harinya.
   Dengan Virtual Account Xendit, sistem menerima pemberitahuan pembayaran secara
   otomatis, dan layanan dibuka dalam hitungan menit.
2. **Isolir yang memutus total.** Menonaktifkan akun PPPoE membuat internet mati
   tanpa penjelasan dan memicu panggilan ke Customer Service. Soft isolir
   mempertahankan koneksi dengan kecepatan minimal dan mengarahkan pelanggan ke
   halaman isolir.

Selain itu, pelanggan enterprise (paket bertarif negosiasi) tidak lagi diisolir
otomatis: memutus layanan korporat berisiko melanggar SLA dan merusak relasi bisnis.

**Mengapa Xendit, bukan VA langsung dari bank:** integrasi VA langsung (SNAP BI)
mengharuskan ISP memiliki perjanjian VA dengan setiap bank dan — sebagai pengguna
non-PJP — mengajukan verifikasi ke Bank Indonesia, dengan satu integrasi per bank.
Xendit menyediakan VA banyak bank lewat satu integrasi dan onboarding merchant yang
jauh lebih ringan, sehingga MVP dapat segera dipakai ISP calon klien.

### Tujuan Utama (Objective)

Mengotomatisasi siklus penagihan dan akses layanan ISP — dari tagihan terbit,
pembayaran, isolir, hingga pembukaan kembali — dengan intervensi admin seminimal
mungkin, sambil memperlakukan pelanggan residensial dan enterprise sesuai karakter
masing-masing.

### Ruang Lingkup (In-Scope)

**A. Akses & Pembayaran Pelanggan (Tanpa Login)**
- Halaman tagihan publik via tautan bertoken (tetap dari v3.0).
- Halaman menampilkan **nomor Virtual Account** pelanggan untuk setiap bank yang diaktifkan ISP, beserta total yang harus dibayar.
- Pembayaran **hanya** melalui Virtual Account Xendit; konfirmasi diterima otomatis.
- **Tidak ada** unggah bukti transfer.

**B. Dashboard Admin**
- Login admin JWT + RBAC (superadmin, cs) — **wajib aktif**; bypass hanya untuk development lewat env.
- CRUD pelanggan, paket (termasuk penanda enterprise dan profil MikroTik), tagihan.
- Daftar pembayaran (otomatis via Xendit maupun manual oleh admin).
- **Tandai Lunas** manual oleh admin sebagai jalur cadangan (PIN + catatan + audit log).
- Isolir/buka isolir manual; isolir enterprise khusus manual.
- Monitoring status koneksi, audit log.

**C. Jaringan & Automasi**
- Soft isolir residensial via RouterOS API: ganti profil PPPoE ke profil isolir.
- Halaman isolir (HTTP) untuk pelanggan terisolir.
- Isolir enterprise: throttle tanpa pengalihan halaman, hanya atas keputusan admin.
- Pembukaan isolir otomatis setelah pembayaran terkonfirmasi.
- Antrian & retry operasi jaringan (tetap dari v3.0).

**D. Integrasi Pembayaran**
- **Xendit Fixed Virtual Account** dengan nominal tertutup (*closed amount*).
- Bank VA yang diaktifkan dapat dipilih per ISP (mis. BCA, BNI, BRI, Mandiri, Permata), sesuai yang tersedia di akun Xendit ISP tersebut.
- Abstraksi **penyedia VA** agar penyedia lain (gateway lain atau VA langsung bank) dapat ditambahkan tanpa mengubah logika bisnis.

**E. Notifikasi**
- WhatsApp (Wablas) utama + email pendamping (tetap dari v3.0).
- Pesan tagihan memuat **nomor VA** selain tautan tagihan.

### Di Luar Ruang Lingkup (Out-of-Scope)

- VA langsung dari bank (SNAP BI) — dapat ditambahkan kemudian lewat abstraksi penyedia VA.
- QRIS, e-wallet, gerai retail, kartu kredit (meski tersedia di Xendit).
- Unggah bukti transfer oleh pelanggan.
- Pembayaran sebagian atau deposit/saldo pelanggan.
- RADIUS / CoA, multi-router, hotspot/voucher.
- TR-069 / GenieACS, manajemen OLT, peta ODP.
- Isolir enterprise di lapisan BGP (route withdrawal).
- DHCP Option 114 / Captive Portal API (RFC 8908/8910) — tidak menjangkau perangkat di belakang router pelanggan PPPoE.
- Aplikasi mobile native, ticketing.

---

## 2. Aktor Pengguna (User Roles)

| Aktor | Deskripsi | Cara Mengakses Sistem |
|---|---|---|
| **Pelanggan Residensial** | Pelanggan rumahan, paket bertarif tetap. Tunduk pada isolir otomatis. | Tautan bertoken via WhatsApp/email — tanpa akun |
| **Pelanggan Enterprise** | Pelanggan korporat dengan paket bertarif negosiasi (mis. "JituNet Bussiness"). Mendapat masa tenggang dan isolir manual. | Sama seperti residensial |
| **Admin / Customer Service** | Staf internal ISP (`superadmin` / `cs`). | Dashboard admin, login JWT |
| **Sistem Jaringan (MikroTik)** | Mengirim status koneksi, menerima perintah ganti profil. | Webhook (shared secret) + RouterOS API |
| **Xendit** | Aktor non-manusia. Menerbitkan VA dan mengirim notifikasi pembayaran. | API Xendit (keluar) + callback (masuk, `x-callback-token`) |

---

## 3. User Stories

### A. Modul Penagihan & Pembayaran

**US-01 — Melihat Tagihan & Cara Bayar** *(direvisi)*
Sebagai pelanggan, saya ingin membuka tautan tagihan dan langsung melihat nominal,
jatuh tempo, riwayat 3 bulan, serta **nomor Virtual Account** saya, sehingga saya
tahu persis berapa dan ke mana harus membayar.

**US-02 — Membayar via Virtual Account** *(menggantikan "Mengunggah Bukti Transfer")*
Sebagai pelanggan, saya ingin membayar tagihan dengan mentransfer ke nomor Virtual
Account dari m-banking/ATM, sehingga pembayaran saya tercatat otomatis tanpa perlu
mengirim bukti.

**US-03 — Soft Isolir Otomatis Residensial** *(direvisi)*
Sebagai sistem, saya ingin mengisolir pelanggan residensial yang menunggak lebih dari
3 hari setelah jatuh tempo dengan memindahkannya ke profil isolir (kecepatan minimal +
halaman isolir), sehingga ISP terlindung dari kebocoran pendapatan tanpa membuat
pelanggan kebingungan mengapa internetnya mati.

**US-04 — Generate Tagihan Massal** *(direvisi)*
Sebagai admin, saya ingin tagihan bulanan terbit otomatis tanggal 1 dan pesan
tagihannya memuat nomor VA pelanggan, sehingga pelanggan bisa langsung membayar dari
pesan tersebut.

**US-05 — Konfirmasi Pembayaran Otomatis** *(menggantikan "Verifikasi Pembayaran")*
Sebagai pelanggan, saya ingin layanan saya terbuka kembali otomatis segera setelah
saya membayar via VA, kapan pun waktunya, tanpa menunggu admin.

### B. Modul Pemantauan Jaringan

**US-06 — Indikator Status Koneksi** *(tetap)*
**US-07 — Webhook Status Jaringan** *(tetap)*

### C. Modul Manajemen Data

**US-08 — Tambah Data Pelanggan** *(direvisi)*
Sebagai admin, saya ingin menambahkan pelanggan baru dan sistem otomatis membuatkan
nomor Virtual Account permanen untuknya, sehingga pelanggan memakai nomor VA yang sama
setiap bulan.

### D. Modul Akses & Operasional Pendukung

**US-09 — Akses Tagihan via Tautan Bertoken** *(tetap)*
**US-10 — Kirim Ulang Tautan Tagihan** *(tetap)*
**US-11 — Audit Log** *(direvisi — daftar aksi bertambah)*
**US-12 — Notifikasi Multi-Kanal** *(tetap)*

**US-13 — Isolir Istimewa Enterprise** *(baru)*
Sebagai admin, saya ingin pelanggan enterprise tidak diisolir otomatis, melainkan
diberi masa tenggang 14 hari dan saya diberi peringatan, sehingga keputusan memutus
layanan korporat selalu melalui pertimbangan manusia.

**US-14 — Halaman Isolir** *(baru)*
Sebagai pelanggan terisolir, saya ingin melihat halaman penjelasan saat membuka situs
HTTP, sehingga saya tahu layanan saya diisolir karena tagihan dan tahu cara membayarnya.

**US-15 — Tandai Lunas Manual oleh Admin** *(baru)*
Sebagai admin, saya ingin dapat menandai tagihan lunas secara manual untuk pembayaran
di luar VA (mis. tunai di kantor), sehingga kasus khusus tetap bisa diselesaikan dan
tercatat.

---

## 4. Acceptance Criteria

### US-01 (Melihat Tagihan & Cara Bayar)
- **AC 1:** Membuka tautan bertoken menampilkan rincian tagihan tanpa login.
- **AC 2:** Halaman menampilkan nomor VA pelanggan untuk setiap bank yang diaktifkan, beserta **total tunggakan** yang harus dibayar.
- **AC 3:** Halaman menampilkan langkah singkat membayar via m-banking/ATM untuk setiap bank.
- **AC 4:** Riwayat status 3 bulan terakhir ditampilkan (Lunas, Unpaid, Overdue).
- **AC 5:** Halaman **tidak** menampilkan formulir unggah bukti.
- **AC 6:** Token tidak valid/kedaluwarsa menampilkan pesan yang jelas.

### US-02 (Membayar via Virtual Account)
- **AC 1:** Setiap pelanggan memiliki satu nomor VA permanen **per bank yang diaktifkan**, dibuat sebagai Xendit Fixed Virtual Account dengan `external_id` yang memuat ID pelanggan.
- **AC 2:** VA bersifat **closed amount**: nominal yang dapat dibayar sama dengan total seluruh tagihan Unpaid/Overdue pelanggan; transfer dengan nominal berbeda ditolak bank.
- **AC 3:** Nominal VA (`expected_amount`) **disinkronkan** setiap kali total tunggakan berubah: tagihan terbit, pembayaran diterima, atau Tandai Lunas.
- **AC 4:** Bila pelanggan tidak memiliki tunggakan, VA dinonaktifkan sementara agar tidak dapat menerima transfer, lalu diaktifkan kembali saat tagihan baru terbit.
- **AC 5:** Saat pembayaran sukses, Xendit mengirim callback ke sistem; sistem menandai **seluruh tagihan yang tercakup** pada nominal tersebut sebagai Lunas.
- **AC 6:** Callback diverifikasi dengan membandingkan header `x-callback-token` terhadap token verifikasi milik ISP; callback tanpa token yang cocok ditolak dan dicatat.
- **AC 7:** Callback bersifat **idempoten** berdasarkan `payment_id` Xendit: callback berulang tidak membuat pembayaran ganda dan tetap dijawab sukses.
- **AC 8:** Nominal pada callback harus sama dengan total tunggakan saat itu; bila berbeda (mis. tagihan baru terbit di antara sinkronisasi), pembayaran tetap dicatat dan admin menerima alert untuk ditindaklanjuti.

### US-03 (Soft Isolir Otomatis Residensial)
- **AC 1:** Job berjalan **setiap hari** pukul 00:01 dan mengisolir pelanggan **residensial** yang memiliki tagihan Unpaid/Overdue dengan `due_date + 4 hari ≤ hari ini` (default: tanggal 24). Bila server sempat mati, job hari berikutnya otomatis menyusul.
- **AC 2:** Isolir dilakukan dengan mengganti profil secret PPPoE menjadi profil isolir (default `isolir`), lalu memutus sesi aktif agar profil baru langsung berlaku. Akun PPPoE **tidak** dinonaktifkan.
- **AC 3:** Profil isolir di router membatasi kecepatan dan memasukkan IP pelanggan ke address-list isolir (lihat §7.3).
- **AC 4:** Status pelanggan menjadi "Terisolir", dicatat ke `audit_log`, dan notifikasi isolir (WA + email) memuat nomor VA serta tautan tagihan.
- **AC 5:** Kegagalan RouterOS API: retry 3x dengan exponential backoff, lalu masuk antrian tertunda dan alert admin (tetap dari v3.0).

### US-04 (Generate Tagihan Massal)
- **AC 1–4, 7:** tetap dari v3.0 (cron tanggal 1, jatuh tempo tanggal 20, status awal Unpaid, cegah duplikasi, tombol manual khusus superadmin).
- **AC 5:** Token akses tagihan tetap diterbitkan per invoice.
- **AC 6:** Setelah tagihan terbit, nominal VA pelanggan disinkronkan ke total tunggakan terbaru sebelum notifikasi dikirim.
- **AC 8:** Notifikasi tagihan terbit memuat **nomor VA**, total, jatuh tempo, dan tautan tagihan.

### US-05 (Konfirmasi Pembayaran Otomatis)
- **AC 1:** Callback pembayaran yang valid membuat catatan pembayaran (metode `va_xendit`) dan menandai tagihan terkait Lunas dalam satu transaksi database.
- **AC 2:** Bila setelahnya pelanggan tidak memiliki tunggakan lain dan berstatus Terisolir, sistem mengembalikan profil PPPoE ke profil paketnya dan memutus sesi aktif, sehingga layanan normal kembali **maksimal 5 menit** setelah callback diterima.
- **AC 3:** Bila pelanggan berstatus Menunggak (belum terisolir), status kembali Aktif.
- **AC 4:** Pelanggan menerima notifikasi "pembayaran diterima" (WA + email).
- **AC 5:** Kegagalan membuka isolir di router tidak membatalkan pencatatan pembayaran; operasi jaringan masuk antrian retry.
- **AC 6:** Job rekonsiliasi berkala mencocokkan pembayaran VA di Xendit dengan catatan sistem, untuk menangkap callback yang tidak sampai.
- **AC 7:** Seluruh pembayaran otomatis dicatat ke `audit_log` dengan referensi `payment_id` Xendit.

### US-06, US-07 (Pemantauan Jaringan)
Tetap seperti v3.0.

### US-08 (Tambah Data Pelanggan)
- **AC 1–5:** tetap dari v3.0 (field wajib, nomor WA, PPPoE unik, status awal Pending Provisioning).
- **AC 6:** Sistem otomatis membuat VA Xendit untuk pelanggan baru (per bank yang diaktifkan). Bila pembuatan gagal, sistem mencoba ulang secara berkala dan menampilkan status "VA belum tersedia" di dashboard.
- **AC 7:** Nomor VA tidak berubah walau data pelanggan diubah.
- **AC 8:** Jenis pelanggan (residensial/enterprise) mengikuti paket yang dipilih.

### US-09, US-10, US-12
Tetap seperti v3.0.

### US-11 (Audit Log)
- **AC 1:** Aksi yang dicatat ditambah: pembayaran VA diterima, callback ditolak (token tidak valid), selisih nominal, tandai lunas manual, peringatan enterprise terkirim, isolir/buka isolir enterprise.
- **AC 2–3:** tetap dari v3.0.

### US-13 (Isolir Istimewa Enterprise)
- **AC 1:** Pelanggan enterprise adalah pelanggan dengan paket bertanda `is_enterprise` (otomatis untuk paket bertarif custom, mis. "JituNet Bussiness").
- **AC 2:** Job isolir otomatis **tidak pernah** mengisolir pelanggan enterprise.
- **AC 3:** Pada `due_date + 4 hari`, admin menerima peringatan (WA + email) bahwa pelanggan enterprise belum membayar.
- **AC 4:** Pada `due_date + 14 hari` (akhir masa tenggang), admin menerima peringatan kedua "masa tenggang habis — perlu keputusan".
- **AC 5:** Isolir enterprise hanya dapat dilakukan manual oleh **superadmin + PIN**, menggunakan profil `isolir-enterprise` (throttle kecepatan, **tanpa** pengalihan halaman).
- **AC 6:** Pembayaran VA membuka isolir enterprise secara otomatis seperti residensial.
- **AC 7:** Masa tenggang enterprise dapat diatur lewat konfigurasi (`ENTERPRISE_GRACE_DAYS`, default 14).

### US-14 (Halaman Isolir)
- **AC 1:** Pelanggan terisolir yang membuka situs **HTTP** diarahkan ke halaman isolir.
- **AC 2:** Lalu lintas **HTTPS tidak dibelokkan** (menghindari peringatan sertifikat/HSTS di peramban); akses HTTPS ke luar ditolak oleh firewall isolir.
- **AC 3:** Halaman isolir menjelaskan bahwa layanan diisolir karena tagihan, meminta pelanggan memeriksa WhatsApp untuk nomor VA dan tautan tagihan, serta mencantumkan kontak CS.
- **AC 4:** DNS dan domain aplikasi tagihan tetap dapat diakses dari jaringan isolir.

### US-15 (Tandai Lunas Manual oleh Admin)
- **AC 1:** Tombol "Tandai Lunas" tersedia di detail tagihan untuk superadmin.
- **AC 2:** Aksi mewajibkan PIN dan catatan alasan (mis. "bayar tunai di kantor").
- **AC 3:** Pembayaran dicatat dengan metode `manual_admin`, admin pelaksana, dan catatannya; tercatat di `audit_log`.
- **AC 4:** Efek lanjutan sama dengan pembayaran VA: nominal VA disinkronkan, isolir dibuka otomatis, notifikasi dikirim.

---

## 5. Arsitektur dan Tech Stack

Tetap seperti v3.0 (React + Go + Node.js + PostgreSQL + Redis + RouterOS API), dengan
tambahan berikut.

### Pembagian Tanggung Jawab Baru

**`isp-billing-service` (Go)** — pemilik seluruh interaksi dengan Xendit
- Abstraksi `VAProvider` (implementasi pertama: Xendit Fixed Virtual Account).
- Pembuatan VA pelanggan dan sinkronisasi `expected_amount`, dijalankan oleh job berkala (menyusul otomatis bila gagal).
- Endpoint callback pembayaran Xendit: verifikasi `x-callback-token`, idempotensi, pencatatan pembayaran.
- Konfirmasi pembayaran → buka isolir (memakai logika `Reactivate` yang sudah ada, tanpa lompatan antar-service).
- Job rekonsiliasi pembayaran.
- Abstraksi provider MikroTik diperluas: ganti profil PPPoE + putus sesi.
- Job harian: isolir residensial, peringatan enterprise.

**`isp-api-service` (Node.js)**
- Tandai Lunas manual (memanggil endpoint internal billing untuk sinkronisasi VA & buka isolir).
- Penghapusan endpoint unggah bukti dan alur approve/reject.
- CRUD paket: field `is_enterprise` dan `mikrotik_profile`.
- Halaman tagihan publik menyertakan nomor VA.

**`isp-frontend`**
- Halaman tagihan: nomor VA per bank + panduan bayar, tanpa formulir unggah.
- Dashboard: daftar pembayaran (otomatis/manual), tombol Tandai Lunas, penanda enterprise, status VA pelanggan.
- Login admin aktif kembali.

**Infrastruktur**
- Halaman isolir statis (HTTP) dilayani nginx di VPS.
- URL callback Xendit diekspos via HTTPS dan didaftarkan di dashboard Xendit ISP.

### Konfigurasi Baru (per ISP)

| Variabel | Fungsi |
|---|---|
| `VA_PROVIDER` | `xendit` (kosong = VA nonaktif, hanya Tandai Lunas) |
| `XENDIT_SECRET_KEY` | API key rahasia (mode test / live) |
| `XENDIT_CALLBACK_TOKEN` | Token verifikasi callback dari dashboard Xendit |
| `XENDIT_VA_BANKS` | Daftar bank VA, mis. `BCA,BNI,BRI,MANDIRI` |
| `MIKROTIK_ISOLIR_PROFILE` | Default `isolir` |
| `MIKROTIK_ENTERPRISE_ISOLIR_PROFILE` | Default `isolir-enterprise` |
| `ENTERPRISE_GRACE_DAYS` | Default `14` |
| `ISOLIR_PAGE_URL` | Alamat halaman isolir HTTP |

> Mode test Xendit menyediakan API **simulasi pembayaran VA**, sehingga seluruh alur
> bayar → lunas → buka isolir dapat didemokan ke ISP tanpa transaksi uang sungguhan.

---

## 6. Siklus Billing (Business Rules)

| Hari | Residensial | Enterprise |
|---|---|---|
| **Tgl 1** (00:00) | Tagihan terbit, nominal VA disinkronkan, notifikasi berisi nomor VA + tautan | Sama |
| **Tgl 17** | Reminder H-3 | Sama |
| **Tgl 20** | Jatuh tempo | Sama |
| **Tgl 21** | Tagihan Overdue, pelanggan Menunggak | Sama |
| **Tgl 24** (00:01) | **Soft isolir otomatis** + notifikasi | **Tidak diisolir**; peringatan ke admin |
| **Jatuh tempo + 14 hari** | — | Peringatan kedua ke admin: masa tenggang habis |
| Setelahnya | — | Isolir **manual** oleh superadmin + PIN (throttle, tanpa redirect) |
| **Kapan saja** | Bayar via VA → Lunas → layanan dibuka otomatis ≤5 menit | Sama |

**Aturan tambahan:**
- VA bersifat **permanen per pelanggan per bank**, dengan nominal tertutup = total seluruh tunggakan.
- Satu pembayaran VA melunasi **seluruh** tunggakan (tidak ada pembayaran sebagian).
- VA dinonaktifkan sementara saat tidak ada tunggakan.
- Pembukaan isolir hanya terjadi bila tidak tersisa tagihan Unpaid/Overdue.
- Job isolir berbasis `due_date`, bukan tanggal kalender tetap, dan menyusul otomatis bila terlewat.

---

## 7. Desain Teknis Kunci

### 7.1 Alur Pembayaran VA Xendit

```
Tagihan terbit / berubah
  sistem → Xendit: buat VA (bila belum ada) / perbarui expected_amount = total tunggakan
Pelanggan → m-banking/ATM: transfer ke nomor VA dengan nominal tepat
Xendit → sistem: callback pembayaran VA (header x-callback-token)
  sistem: verifikasi token → cek payment_id belum pernah diproses
        → catat pembayaran, tagihan Lunas
        → nonaktifkan VA (tunggakan 0) → buka isolir → kirim notifikasi
Job rekonsiliasi: cocokkan pembayaran di Xendit yang belum tercatat
```

### 7.2 Perubahan Skema Database

| Perubahan | Isi |
|---|---|
| `packages.is_enterprise` | **Baru** — penanda paket enterprise; diisi `true` untuk paket `is_custom_price` yang ada |
| `packages.mikrotik_profile` | **Baru** — nama profil PPPoE di router untuk paket ini (dipakai saat buka isolir) |
| `customer_virtual_accounts` | **Baru** — `customer_id`, bank, nomor VA, ID VA Xendit, `external_id`, nominal tersinkron terakhir, status (aktif/nonaktif/gagal dibuat) |
| `va_payments` | **Baru** — `payment_id` Xendit (unik, untuk idempotensi), pelanggan, bank, nominal, daftar tagihan yang dilunasi, waktu bayar, payload mentah |
| `payments` | **Direvisi** — kolom `method` (`va_xendit`, `manual_admin`), referensi `va_payment_id`, `note`; `proof_path` tidak lagi dipakai |
| `invoices.status` | Status `awaiting_verification` tidak lagi dipakai (riwayat lama tetap tersimpan) |

### 7.3 Konfigurasi Router (template diperbarui)

- Profil PPPoE `isolir`: kecepatan minimal, `address-list=isolir`.
- Profil PPPoE `isolir-enterprise`: throttle kecepatan saja, tanpa address-list isolir.
- Firewall untuk address-list `isolir`: izinkan DNS dan domain aplikasi tagihan; alihkan HTTP (port 80) ke halaman isolir; tolak lalu lintas lain. HTTPS tidak dibelokkan.
- Setiap paket memiliki profil PPPoE sendiri yang namanya dicatat di `packages.mikrotik_profile`.

---

## 8. Notifikasi

| Event | Penerima | WhatsApp | Email | Berisi VA |
|---|---|---|---|---|
| Tagihan terbit | Pelanggan | Ya | Ya | Ya |
| Reminder H-3 & jatuh tempo | Pelanggan | Ya | Ya | Ya |
| Soft isolir (residensial) | Pelanggan | Ya | Ya | Ya |
| Pembayaran diterima | Pelanggan | Ya | Ya | — |
| Enterprise belum bayar (jatuh tempo + 4) | **Admin** | Ya | Ya | — |
| Enterprise masa tenggang habis (+14) | **Admin** | Ya | Ya | — |
| Callback ditolak / selisih nominal | **Admin** | — | Ya | — |
| Pembuatan VA gagal berulang | **Admin** | — | Ya | — |
| Job jaringan gagal | **Admin** | — | Ya | — |

---

## 9. Rencana Pengerjaan

### Status Fase Sebelumnya

| Fase | Nama | Status |
|---|---|---|
| 0–8 | MVP v2.0 | Selesai |
| 9 | Akses tagihan bertoken | Selesai |
| 10 | Kanal WhatsApp | Selesai |
| 11 | Integrasi MikroTik nyata | **Tertunda** — digabung dengan uji soft isolir |
| 12 | Deployment produksi | Selesai |

### Fase Baru v4.0

| Fase | Nama | Deliverable Utama | Estimasi |
|---|---|---|---|
| **13** | Pengamanan & Keandalan | Login admin aktif kembali (bypass hanya via env dev); job isolir harian berbasis `due_date` | ½ hari |
| **14** | Pembayaran VA Xendit | Migrasi VA & pembayaran; abstraksi `VAProvider` + klien Xendit; job buat/sinkron VA; endpoint callback (token + idempotensi); buka isolir otomatis; job rekonsiliasi; hapus unggah bukti; Tandai Lunas manual; halaman tagihan menampilkan VA; uji alur penuh dengan simulasi pembayaran mode test | 4 hari |
| **15** | Soft Isolir Residensial | `packages.mikrotik_profile`; provider ganti profil + putus sesi (RouterOS & mock); template router baru; halaman isolir | 3 hari |
| **16** | Isolir Istimewa Enterprise | `packages.is_enterprise`; pengecualian job isolir; peringatan admin +4 / +14; isolir enterprise manual | 2 hari |
| **11** | Uji MikroTik Nyata | Uji ganti profil, address-list, halaman isolir, dan buka isolir ke router fisik | 2–3 hari (butuh perangkat) |
| — | Dokumentasi | README, panduan MikroTik, panduan setup akun Xendit untuk ISP | 1 hari |

**Total:** ±10–11 hari kerja.

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| ISP calon klien belum lolos verifikasi bisnis Xendit (KYB) atau bank tertentu belum aktif di akunnya | Pembayaran otomatis belum dapat dipakai untuk bank tersebut | Bank VA dapat dipilih per ISP; selama menunggu, Tandai Lunas manual; panduan onboarding Xendit untuk ISP |
| Biaya per transaksi VA Xendit | Mengurangi margin ISP | Biaya transparan di materi pengajuan; abstraksi `VAProvider` memungkinkan beralih ke VA langsung bank bila volume sudah besar |
| Nominal VA tertinggal dari total tunggakan (sinkronisasi gagal) | Pelanggan membayar nominal lama / tidak bisa membayar | Sinkronisasi saat setiap perubahan + job berkala; selisih nominal dicatat dan di-alert |
| Callback tidak sampai / terkirim ganda | Tagihan tidak lunas / tercatat ganda | Idempotensi berdasarkan `payment_id`; job rekonsiliasi; alert admin |
| Callback palsu ke endpoint publik | Tagihan ditandai lunas tanpa pembayaran | Verifikasi `x-callback-token`; konfirmasi silang ke API Xendit berdasarkan `payment_id` sebelum melunasi |
| Xendit sedang gangguan | Pembuatan VA / pembayaran tertunda | Retry berkala; Tandai Lunas manual sebagai cadangan |
| Profil MikroTik tidak sesuai `packages.mikrotik_profile` | Buka isolir gagal / kecepatan salah | Validasi profil saat konfigurasi paket; antrian retry + alert |
| Pelanggan enterprise salah klasifikasi | Enterprise terisolir otomatis, atau residensial lolos isolir | Penanda enterprise di level paket, terlihat jelas di dashboard; audit perubahan paket |
| Pelanggan terisolir tidak bisa membuka m-banking dari WiFi rumah | Kesulitan membayar | Pelanggan umumnya memakai data seluler; halaman isolir menjelaskan hal ini |
| Login admin pernah dimatikan untuk development | Dashboard terbuka publik | Fase 13: login wajib; bypass hanya via env development |
| Router lama tidak mendukung konfigurasi isolir | Soft isolir tidak berfungsi | Template diuji di RouterOS v7; dokumentasi versi minimum |

---

## Lampiran A — Glosarium Status

| Entitas | Status | Arti |
|---|---|---|
| Invoice | Unpaid | Tagihan terbit, belum dibayar |
| Invoice | Overdue | Lewat jatuh tempo, belum dibayar |
| Invoice | Lunas | Dibayar via VA atau ditandai lunas oleh admin |
| Invoice | ~~Menunggu Verifikasi~~ | Tidak dipakai lagi sejak v4.0 |
| Pelanggan | Pending Provisioning | Dibuat admin, menunggu webhook pertama |
| Pelanggan | Aktif | Normal, tanpa tunggakan |
| Pelanggan | Menunggak | Ada tagihan Overdue, belum terisolir (atau enterprise dalam masa tenggang) |
| Pelanggan | Terisolir | Profil PPPoE dipindah ke profil isolir |
| Pelanggan | Non-aktif | Dinonaktifkan permanen oleh admin |
| Virtual Account | Aktif | Dapat menerima transfer sebesar total tunggakan |
| Virtual Account | Nonaktif | Tidak ada tunggakan; transfer ditolak |
| Virtual Account | Gagal dibuat | Dicoba ulang berkala; admin di-alert bila berulang |
| Pembayaran | `va_xendit` | Pembayaran otomatis dari VA Xendit |
| Pembayaran | `manual_admin` | Ditandai lunas oleh admin |

---

## Lampiran B — Perubahan dari Versi 3.0

| # | Aspek | v3.0 | v4.0 |
|---|---|---|---|
| 1 | Metode pembayaran | Transfer manual + unggah bukti | **Virtual Account via Xendit** |
| 2 | Verifikasi pembayaran | Admin approve/reject | **Otomatis dari callback Xendit**; Tandai Lunas manual sebagai cadangan |
| 3 | Pembukaan isolir | Setelah admin approve | **Otomatis ≤5 menit setelah bayar**, kapan pun |
| 4 | Metode isolir residensial | Disable secret PPPoE (putus total) | **Soft isolir**: profil isolir + halaman isolir |
| 5 | Pelanggan enterprise | Diperlakukan sama | **Tanpa isolir otomatis**, masa tenggang 14 hari, isolir manual (throttle) |
| 6 | Jadwal isolir | Tepat tanggal 24 | **Harian berbasis `due_date`**, menyusul bila terlewat |
| 7 | Unggah bukti transfer | Ada | **Dihapus** |
| 8 | Posisi produk | Sistem internal ISP | **MVP untuk diajukan ke ISP** (konfigurasi per ISP) |
| 9 | Login admin | Sempat dinonaktifkan untuk development | **Wajib aktif** |

### User Story yang Berubah
- **US-02** — "Mengunggah Bukti Transfer" → **"Membayar via Virtual Account"**
- **US-05** — "Verifikasi Pembayaran" → **"Konfirmasi Pembayaran Otomatis"**
- **US-01, US-03, US-04, US-08, US-11** — direvisi
- **US-13, US-14, US-15** — baru

### Alasan Perubahan
Riset praktik ISP menengah menunjukkan bahwa pembukaan isolir yang bergantung pada
verifikasi manual menunda pendapatan dan memperburuk pengalaman pelanggan, sementara
isolir dengan memutus koneksi total memicu keluhan karena pelanggan tidak mendapat
penjelasan. Pelanggan korporat membutuhkan perlakuan berbeda karena terikat SLA.
Xendit dipilih dibanding VA langsung dari bank karena satu integrasi mencakup banyak
bank dan onboarding ISP jauh lebih ringan (tanpa perjanjian per bank maupun
verifikasi Bank Indonesia).

---

*— Akhir dokumen —*
