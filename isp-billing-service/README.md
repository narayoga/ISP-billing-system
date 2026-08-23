# isp-billing-service

Layanan Go untuk komponen berperforma tinggi & integrasi jaringan ISP MVP.

## Tanggung jawab

- Generate tagihan massal (cron tanggal 1 + endpoint trigger manual).
- Cron isolir otomatis tanggal 24.
- Integrasi Mikrotik RouterOS API: disable / enable PPPoE secret.
- Endpoint webhook penerima status koneksi dari Mikrotik.
- **Owner skema database** (golang-migrate sebagai migration tool).

## Stack

- Go 1.22+
- PostgreSQL 18 driver: `pgx`
- HTTP: `net/http` (atau `chi` saat routing kompleks)
- Mikrotik client: `go-routeros`
- Migration: `golang-migrate`

## Struktur folder

```
cmd/billing/         entry point
internal/billing/    invoice generation & state machine
internal/mikrotik/   RouterOS client + abstraksi NetworkProvider
internal/network/    webhook handler + Redis cache
internal/db/         pgx pool + repositories
internal/config/     env loader
migrations/          SQL migrations (golang-migrate format)
scripts/             helper scripts (seed, dev tools)
```

## Quick start (Fase 0)

```powershell
copy .env.example .env
go run ./cmd/billing
# health check
curl http://localhost:8081/healthz
```

## Env vars

Lihat `.env.example` untuk daftar lengkap.
