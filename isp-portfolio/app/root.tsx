import type { ReactNode } from 'react'
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { Route } from './+types/root'
import './app.css'

export const links: Route.LinksFunction = () => [
  { rel: 'icon', type: 'image/png', href: '/brand/favicon.png' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
