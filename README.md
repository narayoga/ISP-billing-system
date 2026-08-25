# ISP Management System — MVP Workspace

Folder workspace berisi 3 repository independen (polyrepo) untuk Sistem Manajemen
Terintegrasi ISP. Tiap repo akan di-push ke remote masing-masing saat sudah siap.

## Repositories

| Folder | Stack | Tanggung jawab |
|---|---|---|
| `isp-frontend/` | React 19 + TS + Tailwind v4 + Vite + React Router | UI gabungan: `/portal/*` (pelanggan) & `/admin/*` (staf ISP), lazy-loaded |
| `isp-billing-service/` | Go 1.22+ | Billing massal, Mikrotik, webhook, cron, owner skema DB |
| `isp-api-service/` | Node 20+ + Express + TS | CRUD, auth, upload bukti, email, magic link |

Kontrak API hidup di `isp-api-service/contracts/openapi.yaml` (source of truth).

## Prasyarat lokal

| Tool | Versi minimal | Status di mesin ini |
|---|---|---|
| Node.js | 20 | ✅ v24.14.1 |
| Go | 1.22 | ✅ 1.26.2 |
| Git | 2.x | ✅ 2.53 |
| PostgreSQL | 16 | ✅ 18 (running di `localhost:5432`) |
| Redis | 7 | ⏸ skip (service akan fallback ke in-memory dev mode) |
| SMTP | — | ⏸ skip (dev: magic link di-log ke console) |

## Port konvensi (dev)

| Service | Port |
|---|---|
| isp-frontend | 5173 |
| isp-api-service | 8080 |
| isp-billing-service | 8081 |
| PostgreSQL | 5432 |

## Database

Database default: `isp_billing` di Postgres lokal. Buat sekali:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql" -U postgres -h localhost -c "CREATE DATABASE isp_billing;"
```

Database lain (mis. `pas_database`) tidak diutak-atik. `isp-billing-service`
adalah **owner skema** (golang-migrate); `isp-api-service` hanya konsumen.

## Infrastruktur pendukung (Docker)

Redis & MailHog dijalankan via Docker Compose (butuh Docker Desktop):

```powershell
docker compose up -d      # Redis :6379 + MailHog SMTP :1025 / UI :8025
docker compose ps         # cek status
docker compose down       # hentikan
```

- **Redis** — cache status koneksi (TTL 60s). Isi `REDIS_URL=redis://localhost:6379`
  di `isp-billing-service/.env`; kosongkan untuk fallback in-memory.
- **MailHog** — SMTP palsu untuk dev: semua email ditangkap, tidak terkirim ke
  alamat asli. Lihat di http://localhost:8025. Untuk memakainya, set di `.env`:
  `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_USER=`/`SMTP_PASS=` kosong.
- Postgres tetap native di :5432. Jika ingin Postgres via container juga:
  `docker compose --profile with-postgres up -d` (host port **5433**, sesuaikan
  `DATABASE_URL`).

## Deploy (semua service sebagai container)

Dev sehari-hari **tidak perlu** Docker untuk aplikasi — cukup `npm run dev` / `go run`
(hot reload). Docker dipakai saat deploy:

```powershell
cp .env.prod.example .env.prod     # isi semua secret & domain
docker compose --env-file .env.prod -f docker-compose.prod.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm billing migrate up
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm billing seed-admin
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Setelah ada perubahan kode, **Dockerfile tidak perlu diubah** — cukup:

```powershell
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Catatan penting:
- **Frontend**: `VITE_*` di-*bake* ke bundle saat build. Ganti domain API → **wajib
  build ulang** image frontend (bukan sekadar restart container).
- **Timezone**: image billing memuat `tzdata` + `TZ=Asia/Jakarta`. Tanpa ini cron
  tanggal 1/17/20/24 akan berjalan menurut UTC.
- **Postgres 18+**: volume dipasang di `/var/lib/postgresql` (bukan `.../data`).
- **Bukti transfer** tersimpan di volume `uploads-data` (`/var/lib/isp/uploads`)
  agar tidak hilang saat container di-recreate.
- Image: frontend ±74MB (nginx), billing ±58MB (Go static), api ±354MB (Node).

## Notifikasi WhatsApp (Wablas)

Kanal notifikasi utama sejak PRD v3.0; email menjadi pendamping.

**Konfigurasi** (di `.env` kedua backend):

```
WABLAS_BASE_URL=https://smg.wablas.com
WABLAS_TOKEN=<token dari dashboard Wablas>
WABLAS_SECRET=<secret key>
```

Kosongkan `WABLAS_TOKEN` untuk menonaktifkan kanal WhatsApp (email tetap jalan).

**Kontrak API** (terverifikasi terhadap `smg.wablas.com`):

```
POST {base}/api/send-message
Header : Authorization: {token}.{secret}
Body   : application/x-www-form-urlencoded — phone, message
```

Wablas selalu membalas HTTP 200; diterima/ditolak ditentukan field `status` pada body.

> **`status: true` ≠ pesan sudah sampai.** Balasannya berbunyi
> `"Message is pending and waiting to be processed"` — pesan baru masuk
> **antrian**. Wablas memprosesnya dengan jeda sesuai setelan `delay_message`
> pada perangkat (mis. 20 detik/pesan), jadi pengiriman nyata tertunda beberapa
> detik hingga menit bila antrian panjang. Log aplikasi sengaja berbunyi
> *"diterima antrian gateway"*, bukan *"terkirim"*, agar tidak menimbulkan rasa
> aman palsu. Status pengiriman sesungguhnya dilihat di dashboard Wablas
> (API tidak menyediakan endpoint laporan — sudah dicek).

> **Perangkat harus tersambung.** Bila dashboard Wablas menunjukkan device
> terputus, API membalas
> `{"status":false,"message":"device disconnected, need to scan qr code again"}`
> dan pesan tidak terkirim. Scan ulang QR di dashboard Wablas untuk
> menyambungkan nomor pengirim.

Nomor pelanggan disimpan dalam format internasional tanpa `+` (mis.
`628123456789`). Form admin menerima format lokal (`08xx`) dan menormalkannya
otomatis.

## Setup pertama kali

1. **Salin `.env`** di tiap service dari `.env.example`, lalu isi password DB di
   `DATABASE_URL`. Beberapa nilai **wajib sama** lintas service:
   - `JWT_SECRET` — sama di `isp-api-service` & `isp-billing-service`.
   - `INTERNAL_SECRET` — sama di `isp-api-service` & `isp-billing-service`.
   - Dev tanpa perangkat/infra: `MIKROTIK_MOCK=true` dan `REDIS_URL` kosong
     (otomatis fallback in-memory).

2. **Migrasi skema** (dari `isp-billing-service`):
   ```powershell
   cd isp-billing-service
   go run ./cmd/migrate up
   ```

3. **Seed superadmin**:
   ```powershell
   # pakai SEED_ADMIN_* dari .env
   go run ./cmd/seed-admin
   ```

## Menjalankan (3 terminal)

```powershell
# Terminal 1 — API service (Node)
cd isp-api-service; npm run dev

# Terminal 2 — Billing service (Go: HTTP + cron + Mikrotik/webhook)
cd isp-billing-service; go run ./cmd/billing

# Terminal 3 — Frontend (portal + admin)
cd isp-frontend; npm run dev
```

Akses:
- Landing / pilih portal: http://localhost:5173
- Portal Pelanggan: http://localhost:5173/portal
- Admin Dashboard: http://localhost:5173/admin (login pakai akun seed)
- API health: http://localhost:8080/healthz
- Billing health: http://localhost:8081/healthz

## Smoke test E2E (manual)

1. Login admin → **Paket**: buat 1 paket.
2. **Pelanggan**: buat 1 pelanggan (magic link onboarding ter-log di console API).
3. Ambil link `set-password` dari console API → set password pelanggan.
4. **Tagihan** → **Generate Tagihan Massal** (superadmin) → invoice `unpaid` muncul.
5. Login portal pelanggan → unggah bukti (.jpg/.png/.pdf ≤2MB) → invoice `awaiting_verification`.
6. Admin → **Pembayaran** → lihat bukti → **Approve** → invoice `paid`.
7. (Opsional) Webhook status:
   ```powershell
   curl -X POST http://localhost:8081/webhook/network-status `
     -H "X-Webhook-Secret: <WEBHOOK_SECRET>" -H "Content-Type: application/json" `
     -d '{"pppoe_username":"<pppoe>","status":"alive"}'
   ```
   → indikator koneksi hijau di daftar pelanggan (polling 5s).
8. Superadmin → **Audit Log**: semua aksi tercatat.

## Roadmap

8 fase MVP (lihat PRD versi 2.0 §9). Status: **Fase 0–8 selesai** (terverifikasi
kompilasi: `npm run typecheck`, `vite build`, `go build`/`go vet`). Verifikasi
runtime end-to-end dilakukan setelah `.env` + migrasi + seed dijalankan.

Catatan implementasi:
- Frontend **digabung** jadi satu repo `isp-frontend` (portal + admin, lazy-loaded),
  bukan 2 repo terpisah seperti PRD §7 — area tetap terpisah via routing & bundle.
- Data fetching FE: plain `fetch` + React Context/hooks (sesuai scaffold), bukan
  TanStack Query/Zustand.
- Mikrotik & Redis: implementasi **nyata** (go-routeros / go-redis) yang aktif saat
  dikonfigurasi, dengan **mock/in-memory** sebagai default dev. Jalur nyata baru
  terverifikasi sampai kompilasi (belum diuji ke perangkat/Redis sungguhan).
