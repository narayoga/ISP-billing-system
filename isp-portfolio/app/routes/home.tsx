import type { Route } from './+types/home'

export function meta(): Route.MetaDescriptors {
  return [
    { title: 'JITU — Jagonya Internet Ubud' },
    { name: 'description', content: 'Layanan internet Jagonet untuk wilayah Ubud dan sekitarnya.' },
  ]
}

// Placeholder sampai section Beranda dibangun (PRD isp-portfolio Fase 2).
export default function Home() {
  return (
    <main className="container home-placeholder">
      <h1>JITU — Jagonya Internet Ubud</h1>
      <p>Situs sedang disiapkan.</p>
    </main>
  )
}
