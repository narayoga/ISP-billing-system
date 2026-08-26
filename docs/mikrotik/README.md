# Penyambungan Mikrotik — Panduan Pemasangan

Dokumen ini untuk **teknisi jaringan** yang menyambungkan router Mikrotik
dengan ISP Billing System. Tidak perlu paham kode aplikasi.

> **Status pengujian:** skrip pada `setup.rsc.example` **belum diuji pada
> perangkat sungguhan**. Jalankan bertahap dan verifikasi tiap langkah seperti
> urutan di bawah — jangan impor sekaligus ke router produksi.

---

## 1. Apa yang dilakukan sambungan ini

Ada dua arah komunikasi:

```
   Server aplikasi                         Router Mikrotik
   (isp-billing-service)                   (PPPoE server)
   ┌──────────────────┐                    ┌──────────────────┐
   │                  │ ─── API :8728 ───▶ │  isolir /        │
   │                  │                    │  buka isolir     │
   │                  │ ◀── webhook :443 ─ │  lapor status    │
   └──────────────────┘                    └────────┬─────────┘
                                                    │ PPPoE
                                              modem pelanggan
```

| Arah | Fungsi |
|---|---|
| Aplikasi → Router | Menonaktifkan PPP secret pelanggan yang menunggak, dan mengaktifkannya kembali setelah membayar |
| Router → Aplikasi | Melaporkan pelanggan mana yang online/offline (indikator hijau/merah di dashboard) |

---

## 2. Prasyarat

- [ ] Router Mikrotik sudah berfungsi sebagai **PPPoE server** dan pelanggan sudah bisa internetan
- [ ] Tiap pelanggan sudah punya **PPP secret** masing-masing
- [ ] Server aplikasi bisa menjangkau router (lihat bagian 3)
- [ ] Akses admin ke router (Winbox/SSH)

---

## 3. Membuka jalur jaringan

Ini bagian tersulit dan **harus beres lebih dulu** — konfigurasi lain sia-sia
tanpa ini.

| Cara | Syarat | Keamanan |
|---|---|---|
| **A. IP publik statis di router** | Berlangganan IP publik | Port 8728 wajib dibatasi hanya ke IP server |
| **B. VPN (WireGuard/L2TP)** | Router men-dial VPN ke server | **Disarankan** — port API tidak pernah terekspos ke internet |

Dengan cara B, router menghubungi server (koneksi keluar), sehingga router
**tidak perlu IP publik** sama sekali.

⚠️ Jangan pernah membuka port 8728 ke internet luas tanpa pembatasan IP.

---

## 4. Menyiapkan berkas konfigurasi

```bash
cp setup.rsc.example setup.rsc
```

Lalu ganti seluruh placeholder di dalamnya:

| Placeholder | Isi dengan | Contoh |
|---|---|---|
| `<IP_VPS>` | IP server aplikasi (atau IP di dalam VPN) | `10.10.0.1` |
| `<PASSWORD_API>` | Password baru untuk user API router | acak, panjang |
| `<URL_BILLING>` | URL publik billing service, tanpa `/` di akhir | `https://billdesk-net.actcomp.online` |
| `<WEBHOOK_SECRET>` | **Sama persis** dengan `WEBHOOK_SECRET` di `.env` aplikasi | — |
| `<NAMA_PROFILE>` | Nama PPP profile pelanggan | `paket-20mbps` |

> `setup.rsc` yang sudah terisi **berisi rahasia** dan sudah masuk
> `.gitignore` — jangan di-commit, jangan dikirim lewat WhatsApp/email biasa.

---

## 5. Menyiapkan sisi aplikasi

Pada `isp-billing-service/.env`:

```
MIKROTIK_HOST=<ip-router-atau-ip-vpn>
MIKROTIK_PORT=8728
MIKROTIK_USER=billing-api
MIKROTIK_PASSWORD=<PASSWORD_API>
MIKROTIK_MOCK=false
```

**`MIKROTIK_MOCK=false` adalah saklarnya.** Selama masih `true`, aplikasi hanya
berpura-pura melakukan isolir dan mencatatnya di log.

Setelah service dijalankan ulang, periksa log:

```
[mikrotik] provider = routeros @ 10.10.0.2:8728    ← tersambung ke router nyata
[mikrotik] provider = mock (dev)                    ← masih mode pura-pura
```

---

## 6. ⚠️ Kecocokan nama — penyebab kegagalan tersering

Nilai `pppoe_username` pada data pelanggan di aplikasi harus **sama persis**
dengan `name` pada PPP secret di router.

| Aplikasi (form admin) | Router |
|---|---|
| `pppoe_username = budi01` | `/ppp secret ... name=budi01` |

Beda satu huruf atau ada spasi → isolir gagal, operasi masuk antrian percobaan
ulang, dan admin menerima email peringatan.

---

## 7. Urutan verifikasi

Kerjakan berurutan. Bila gagal, jelas macetnya di langkah mana.

| # | Uji | Cara | Harapan |
|---|---|---|---|
| 1 | Router terjangkau | `ping <ip-router>` dari server | Ada balasan |
| 2 | Port API terbuka | `nc -zv <ip-router> 8728` | `succeeded` |
| 3 | Aplikasi pakai router nyata | Jalankan ulang billing service, baca log | `provider = routeros` |
| 4 | **Isolir manual** | Dashboard admin → pelanggan → **Isolir Jaringan** | Di router: `/ppp secret print` → `disabled=yes` |
| 5 | Sesi terputus | `/ppp active print` | Pelanggan hilang dari daftar |
| 6 | **Buka isolir** | Approve pembayaran di dashboard | `disabled=no` |
| 7 | Status online | Sambungkan modem pelanggan | Indikator di dashboard jadi hijau |
| 8 | Heartbeat | Tunggu lebih dari 60 detik | Indikator **tetap** hijau (tidak berubah abu-abu) |

**Langkah 4 adalah momen pembuktian.** Bila berhasil, penyambungan sudah benar.

**Langkah 8 menguji BAGIAN 5** pada skrip. Bila indikator berubah abu-abu
setelah semenit, scheduler heartbeat belum berjalan.

---

## 8. Bila terjadi masalah

| Gejala | Penyebab biasanya | Perbaikan |
|---|---|---|
| `pppoe secret tidak ditemukan` | Nama tidak cocok | Samakan `pppoe_username` dengan `name` di router |
| Timeout / connection refused | Port 8728 tertutup atau router tak terjangkau | Periksa firewall dan `/ip service print` |
| Login gagal | Password salah atau policy kurang | Pastikan group punya `api,read,write,test` |
| `disabled=yes` tapi pelanggan masih online | Sesi aktif belum diputus | Pastikan user berhak menjalankan `/ppp/active/remove` |
| Aplikasi seolah berhasil tapi router tidak berubah | Masih `MIKROTIK_MOCK=true` | Set `false`, jalankan ulang service |
| Indikator hijau lalu jadi abu-abu | Heartbeat belum terpasang | Periksa `/system scheduler print` |
| Webhook ditolak `401` | `X-Webhook-Secret` tidak sama | Samakan dengan `.env` aplikasi |
| Webhook gagal dari router | RouterOS lama bermasalah dengan HTTPS | Tambahkan `check-certificate=no` pada `/tool fetch`, atau pakai subdomain **DNS-only** (bukan proxy Cloudflare) |

Untuk memeriksa apakah skrip pelaporan berjalan:

```
/log print where message~"fetch"
/system scheduler print
```

---

## 9. Yang terjadi setelah tersambung

**Isolir otomatis, tanggal 24 pukul 00:01** — tanpa campur tangan siapa pun:

1. Aplikasi mencari pelanggan yang tagihannya belum lunas
2. Menyambung ke API router
3. `/ppp/secret/set ... disabled=yes`
4. Memutus sesi aktif agar efeknya langsung terasa
5. Status pelanggan menjadi *Terisolir*, tercatat di audit log
6. Notifikasi WhatsApp + email terkirim ke pelanggan

**Saat pelanggan membayar:**

1. Pelanggan mengunggah bukti lewat tautan WhatsApp
2. Admin menekan **Approve**
3. Aplikasi menjalankan `/ppp/secret/set ... disabled=no`
4. Pelanggan menyambung ulang → internet hidup kembali

**Bila router sedang tak terjangkau:** operasi tidak hilang — masuk antrian dan
dicoba ulang otomatis dengan jeda meningkat hingga 8 kali. Bila tetap gagal,
admin menerima email peringatan. Jadi pelanggan yang sudah membayar tidak akan
tertinggal dalam keadaan terisolir hanya karena router sempat mati.

---

## 10. Ringkasan untuk teknisi

> Buka API Mikrotik hanya untuk IP server aplikasi (idealnya lewat VPN), buat
> user khusus dengan policy `api,read,write,test`, pastikan nama PPP secret sama
> persis dengan `pppoe_username` di aplikasi, pasang skrip pelaporan status
> beserta scheduler heartbeat 30 detik, lalu isi 5 baris `.env` dan set
> `MIKROTIK_MOCK=false`.
>
> Uji dengan menekan tombol **Isolir Jaringan** di dashboard dan periksa apakah
> `disabled` berubah di router.
