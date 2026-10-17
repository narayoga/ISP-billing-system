# isp-portfolio

Landing page **JITU — Jagonya Internet Ubud** (Jagonet cabang Bali). Situs statis
hasil prerender: React 19 + TypeScript + React Router 7 (framework mode,
`ssr: false`) di atas Vite, dengan styling **CSS murni** (tanpa Tailwind).

Acuan kebutuhan: [`../PRD-isp-portfolio-versi-1.0.md`](../PRD-isp-portfolio-versi-1.0.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5174
```

## Script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server di port 5174 (5173 dipakai `isp-frontend`) |
| `npm run build` | Build + prerender ke `build/client` |
| `npm run preview` | Sajikan hasil build secara lokal (port 4174) |
| `npm run typecheck` | Bangkitkan type route lalu cek TypeScript |
| `npm run lint` | ESLint |

## Struktur

```
app/
  root.tsx      kerangka HTML (lang="id"), meta global, error boundary
  routes.ts     daftar route
  routes/       satu file per halaman
  app.css       token warna/font (CSS variables) + reset
public/         aset statis (robots.txt, …)
  brand/        logo & favicon Jagonet (dari jagonet.co.id/assets/img/)
react-router.config.ts   ssr: false + daftar route yang di-prerender
```

Route baru: tambahkan di `app/routes.ts` **dan** di `prerender` pada
`react-router.config.ts` supaya ikut dibangun sebagai HTML statis.

## Deploy (Cloudflare Pages)

Root directory `isp-portfolio`, build command `npm run build`, output
directory `build/client`, Node 22 (lihat `.nvmrc`).
