# isp-api-service

Service operasional ISP (Node.js + Express + TypeScript).

## Tanggung jawab

- Autentikasi JWT (admin + pelanggan) & RBAC ringan.
- CRUD pelanggan, paket internet, manajemen tagihan & pembayaran.
- Endpoint upload bukti transfer (local disk via `UPLOAD_DIR`).
- Pengiriman email magic link & notifikasi transaksional (dev: log ke console).
- **Konsumen skema database** (migrasi dimiliki `isp-billing-service`).

## Stack

- Node.js 20+ (tested di 24)
- Express 5, TypeScript, tsx (dev runner)
- `pg` untuk Postgres, `zod` validation, `pino` logging
- `jsonwebtoken` + `bcrypt`

## Struktur folder

```
src/
  index.ts          entry point
  routes/           HTTP route handlers
  middleware/       auth, error handler, dll
  services/         business logic (customers, invoices, payments, ...)
  db/               pg pool + repositories
  lib/              logger, jwt helper, mailer
contracts/
  openapi.yaml      kontrak API (source of truth FE↔BE)
```

## Quick start (Fase 0)

```powershell
copy .env.example .env
npm run dev
# health check
curl http://localhost:8080/healthz
```

## Scripts

- `npm run dev` — tsx watch (hot reload)
- `npm run build` — tsc ke `dist/`
- `npm start` — jalankan hasil build
- `npm run typecheck` — type-check tanpa emit
