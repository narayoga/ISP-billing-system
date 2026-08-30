# Artefak Deployment

Berkas pendukung untuk menjalankan ISP Billing System di VPS.

## Topologi

```
   Cloudflare                              VPS
   (frontend React)                        103.134.154.151
   billdesk.<domain>                       ┌────────────────────────────┐
        │                                  │ nginx + TLS                │
        └──────── HTTPS ──────────────────▶│  ├─ billdesk-api.<domain>  │
                                           │  │    └▶ 127.0.0.1:8080    │
                                           │  └─ billdesk-net.<domain>  │
                                           │       └▶ 127.0.0.1:8081    │
                                           │                            │
                                           │ jaringan privat Docker:    │
                                           │  Postgres · Redis · uploads│
                                           └────────────┬───────────────┘
                                                        │ API 8728
                                                   Mikrotik
```

## Isi folder

| Berkas | Fungsi |
|---|---|
| `dns-setup.md` | Pengaturan domain & DNS (kerjakan paling awal) |
| `vps-setup.md` | Pemasangan di server: Docker, aplikasi, nginx, HTTPS, backup |
| `nginx-billdesk.conf.example` | Reverse proxy + TLS untuk dua subdomain backend |
| `generate-secrets.ps1` / `.sh` | Pembuat secret produksi — jalankan di mesin sendiri |
| `backup-db.sh` | Backup Postgres terjadwal, dengan retensi |

Berkas terkait di root repo:

| Berkas | Fungsi |
|---|---|
| `docker-compose.prod.yml` | Definisi backend produksi |
| `.env.prod.example` | Template seluruh variabel produksi |

## Urutan pemasangan

1. **DNS** — arahkan subdomain ke IP VPS
2. **Docker** — pasang di VPS, salin repo
3. **`.env.prod`** — salin dari `.env.prod.example`, isi seluruh secret
4. **Bangun & jalankan**
   ```bash
   docker compose --env-file .env.prod -f docker-compose.prod.yml build
   docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm billing migrate up
   docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm billing seed-admin
   docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
   ```
5. **nginx + TLS** — pasang konfigurasi, jalankan certbot
6. **Frontend** — deploy ke Cloudflare (root directory `isp-frontend`)
7. **Backup** — pasang `backup-db.sh` ke cron

## Yang mudah terlewat

**TLS wajib, bukan pelengkap.** Frontend di Cloudflare selalu HTTPS. Bila backend
masih HTTP, browser memblokir seluruh permintaan (mixed content) dan aplikasi
tidak bisa dipakai sama sekali.

**`TRUST_PROXY=1`.** Tanpa ini, rate limit membaca IP nginx alih-alih IP
pengunjung — satu pengguna nakal bisa memblokir semua pelanggan.

**`CORS_ORIGINS` harus persis.** Berisi origin frontend Cloudflare, lengkap
dengan `https://` dan tanpa garis miring di akhir.

**`VITE_*` di-bake saat build.** Mengubah domain API berarti frontend **wajib
di-build ulang** di Cloudflare, bukan sekadar mengubah variabel lalu restart.

**`MIKROTIK_MOCK`.** Biarkan `true` sampai router benar-benar tersambung,
agar cron tanggal 24 tidak mencoba mengisolir lewat perangkat yang belum ada.

**Backup di server yang sama bukan backup.** Salin berkas hasil backup ke
tempat lain secara berkala.

## Verifikasi image

Ketiga image sudah diuji build dan dijalankan secara lokal:

| Image | Ukuran | Hasil uji |
|---|---|---|
| `isp-billing-service` | 58 MB | Binary jalan, gagal rapi tanpa `DATABASE_URL` |
| `isp-api-service` | 354 MB | Entrypoint jalan, log terstruktur |
| `isp-frontend` | 74 MB | Menyajikan halaman, `/healthz` ok, SPA fallback berfungsi |
