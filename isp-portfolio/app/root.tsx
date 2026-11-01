import type { ReactNode } from 'react'
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { Route } from './+types/root'
import { useSmoothScroll } from './lib/useSmoothScroll'
import 'lenis/dist/lenis.css'
import './app.css'
import './styles/animations.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/png', href: '/brand/favicon.png' },
]

// Dijalankan sebelum halaman tampil: menandai bahwa JavaScript aktif, sehingga
// animasi masuk (.js .reveal) hanya menyembunyikan konten bila JS benar-benar jalan.
const MARK_JS = "document.documentElement.classList.add('js')"

export function Layout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: kelas "js" ditambahkan skrip di atas sebelum hidrasi.
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: MARK_JS }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  useSmoothScroll()
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className="container error-page">
      <h1>{notFound ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}</h1>
      <p>
        {notFound
          ? 'Halaman yang Anda cari tidak tersedia.'
          : 'Silakan muat ulang halaman atau coba beberapa saat lagi.'}
      </p>
      <a href="/">Kembali ke Beranda</a>
    </main>
  )
}
