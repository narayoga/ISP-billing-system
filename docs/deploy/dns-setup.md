# Pengaturan DNS & Domain

Panduan menyiapkan `actcomp.online` untuk ISP Billing System.

## Kondisi awal (diperiksa 27 Agustus 2026)

| Item | Kondisi |
|---|---|
| Registrar | GoDaddy |
| Nameserver | `ns65.domaincontrol.com`, `ns66.domaincontrol.com` (DNS GoDaddy) |
| A record domain utama | Mengarah ke IP parkir GoDaddy — belum dipakai aplikasi |
| MX (email) | Tidak ada |
| TXT (SPF/verifikasi) | Tidak ada |
| `www` | Tidak ada |
| Subdomain `billdesk*` | Belum ada |
| VPS `103.134.154.151` | Merespons ping (~34 ms) |

**Domain masih kosong.** Ini justru waktu terbaik memindahkan DNS — tidak ada
record yang bisa rusak, dan aplikasi lain Anda belum terpasang.

---

## Keputusan: pindahkan nameserver ke Cloudflare

**Ini bukan sekadar preferensi — ini keharusan teknis.** Untuk memasang custom
domain pada project Cloudflare (Pages/Workers), domainnya **harus berada di DNS
Cloudflare**. Selama nameserver masih di GoDaddy, `billdesk.actcomp.online`
tidak bisa diarahkan ke frontend Anda.

Yang perlu dipahami:
- **Registrasi tetap di GoDaddy** — Anda tidak memindahkan kepemilikan domain,
  hanya siapa yang melayani DNS-nya
- **Gratis** di Cloudflare
- Berlaku untuk **seluruh domain**, termasuk aplikasi lain yang nanti Anda pasang
  di `actcomp.online`

---

## Langkah 1 — Tambahkan domain ke Cloudflare

1. Masuk dashboard Cloudflare → **Add a site** → ketik `actcomp.online`
2. Pilih paket **Free**
3. Cloudflare memindai record yang ada. Karena domain masih kosong, hasilnya
   akan minim — wajar
4. Cloudflare menampilkan dua nameserver, mis.
   `xxx.ns.cloudflare.com` dan `yyy.ns.cloudflare.com`

## Langkah 2 — Ganti nameserver di GoDaddy

1. GoDaddy → **My Products** → `actcomp.online` → **DNS** → **Nameservers**
2. Pilih **Change** → **I'll use my own nameservers**
3. Masukkan dua nameserver dari Cloudflare, hapus yang lama
4. Simpan

Propagasi biasanya **15 menit – 2 jam**, kadang sampai 24 jam. Cloudflare
mengirim email bila sudah aktif.

Verifikasi:
```bash
nslookup -type=NS actcomp.online 8.8.8.8
```
Harus menampilkan nameserver Cloudflare, bukan `domaincontrol.com`.

## Langkah 3 — Buat DNS record

Setelah domain aktif di Cloudflare, tambahkan di **DNS → Records**:

| Type | Name | Content | Proxy | Keterangan |
|---|---|---|---|---|
| A | `billdesk-api` | `103.134.154.151` | 🟠 Proxied | Backend Node |
| A | `billdesk-net` | `103.134.154.151` | ⚪ **DNS only** | Backend Go + webhook Mikrotik |

Frontend (`billdesk`) **tidak dibuat manual di sini** — Cloudflare membuatnya
otomatis saat Anda memasang custom domain pada project (lihat Langkah 4).

### ⚠️ Kenapa `billdesk-net` harus DNS-only

Subdomain ini menerima webhook dari router Mikrotik. RouterOS versi lama sering
gagal memverifikasi sertifikat di balik proksi Cloudflare, sehingga laporan
status koneksi tidak sampai dan indikator dashboard tetap abu-abu.

DNS-only berarti trafik langsung ke VPS. Konsekuensinya: subdomain ini tidak
mendapat perlindungan DDoS Cloudflare, dan **IP VPS Anda terlihat publik**.
Itu bisa diterima karena aksesnya sudah dibatasi nginx + rate limit aplikasi.

Bila nanti terbukti router Anda sanggup HTTPS lewat proksi, ubah ke Proxied.

## Langkah 4 — Custom domain untuk frontend

Di project Cloudflare (Pages/Workers) Anda:

1. Buka project → **Custom domains** → **Set up a custom domain**
2. Masukkan `billdesk.actcomp.online`
3. Cloudflare membuat record DNS-nya otomatis dan menerbitkan sertifikat

## Langkah 5 — Verifikasi

```bash
nslookup billdesk-api.actcomp.online 8.8.8.8    # → IP Cloudflare (proxied)
nslookup billdesk-net.actcomp.online 8.8.8.8    # → 103.134.154.151 (DNS only)
nslookup billdesk.actcomp.online 8.8.8.8        # → IP Cloudflare
```

`billdesk-api` menampilkan IP Cloudflare, **bukan** IP VPS — itu memang
perilaku proxy yang benar, bukan kesalahan.

---

## Nilai yang dipakai di konfigurasi

Setelah DNS siap, isikan ke `.env.prod`:

```
CORS_ORIGINS=https://billdesk.actcomp.online
PUBLIC_BASE_URL=https://billdesk.actcomp.online
VITE_API_BASE_URL=https://billdesk-api.actcomp.online
VITE_BILLING_BASE_URL=https://billdesk-net.actcomp.online
```

Dan pada `docs/mikrotik/setup.rsc`:
```
<URL_BILLING> = https://billdesk-net.actcomp.online
```

---

## Urutan yang benar

DNS harus beres **sebelum** langkah berikutnya, karena saling bergantung:

```
1. Nameserver pindah ke Cloudflare
2. Record billdesk-api & billdesk-net dibuat
        ↓
3. Certbot di VPS  ← butuh DNS sudah mengarah ke VPS untuk verifikasi domain
        ↓
4. Frontend di-build di Cloudflare  ← butuh domain backend final,
                                       karena VITE_* di-bake saat build
```

Menjalankan certbot sebelum DNS mengarah ke VPS akan gagal — Let's Encrypt
memverifikasi kepemilikan domain dengan menghubungi server yang ditunjuk DNS.

---

## Berhati-hati bila aplikasi lain sudah jalan

Panduan ini aman karena `actcomp.online` masih kosong. Bila kelak Anda sudah
menaruh aplikasi lain di domain ini, **catat seluruh DNS record sebelum
mengganti nameserver** — record yang tidak tersalin ke Cloudflare akan
menghilang saat perpindahan.
