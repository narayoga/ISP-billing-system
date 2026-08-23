# isp-frontend

Aplikasi frontend gabungan (Customer Portal + Admin Dashboard) — React 19 + TypeScript + Tailwind v4 + Vite.

## Struktur routing

| Path | Audience | Status |
|---|---|---|
| `/` | Landing — pilih portal | ✅ stub |
| `/portal/*` | Pelanggan | ✅ stub (Fase 4 isi) |
| `/admin/*` | Admin/CS | ✅ stub (Fase 2 isi) |

Kedua area di-load via `React.lazy()` sehingga bundle utama tetap kecil dan
pelanggan tidak men-download chunk admin (dan sebaliknya).

## Tanggung jawab

### Area `/portal/*`
- Login pelanggan + magic link onboarding (set password pertama kali).
- Lihat tagihan bulan ini + riwayat 3 bulan.
- Upload bukti transfer (max 2MB, .jpg/.png/.pdf).
- Info paket aktif (kuota / FUP / kecepatan).

### Area `/admin/*`
- Login admin (JWT + RBAC: superadmin / cs).
- CRUD pelanggan + paket internet.
- List & verifikasi pembayaran (Approve/Reject + viewer bukti).
- Trigger manual generate tagihan massal.
- Monitoring status koneksi pelanggan (indikator hijau/merah, polling 5 detik).
- Audit log (read-only untuk superadmin).

## Quick start

```powershell
copy .env.example .env
npm run dev
# buka http://localhost:5173
```

## Env vars

- `VITE_API_BASE_URL` — base URL ke isp-api-service (default `http://localhost:8080`).
- `VITE_BILLING_BASE_URL` — base URL ke isp-billing-service (default `http://localhost:8081`).

## Struktur folder

```
src/
  App.tsx              router root + lazy boundaries
  routes/
    Landing.tsx        landing page (pilih portal)
    customer/          area /portal/*
      index.tsx        sub-router
      CustomerLayout.tsx
      CustomerHome.tsx
    admin/             area /admin/*
      index.tsx        sub-router
      AdminLayout.tsx
      AdminHome.tsx
```
