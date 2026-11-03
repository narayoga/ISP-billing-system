import type { MetaDescriptor } from 'react-router'
import { site } from '../content/site'

export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'http://localhost:5174').replace(/\/$/, '')

type PageMeta = {
  /** Judul halaman tanpa nama brand; kosongkan untuk Beranda */
  title?: string
  description?: string
  /** Path kanonis, mis. "/layanan" */
  path: string
  noindex?: boolean
  /** Data terstruktur (lihat lib/structured-data.ts) */
  jsonLd?: object[]
}

/** Gambar pratinjau tautan 1200×630 (dibuat `npm run og-image`). */
const OG_IMAGE = '/og-image.jpg'

/** Meta, canonical, dan Open Graph unik per halaman (PRD US-10 AC 2). */
export function pageMeta({ title, description = site.seo.description, path, noindex, jsonLd = [] }: PageMeta): MetaDescriptor[] {
  const fullTitle = title ? `${title} | ${site.brand.name}` : site.seo.defaultTitle
  const url = `${SITE_URL}${path}`
  return [
    { title: fullTitle },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: site.brand.name },
    { property: 'og:title', content: fullTitle },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: 'id_ID' },
    { property: 'og:image', content: `${SITE_URL}${OG_IMAGE}` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: `${site.brand.name} — ${site.brand.tagline}` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: fullTitle },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${SITE_URL}${OG_IMAGE}` },
    ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ...jsonLd.map((data) => ({ 'script:ld+json': data })),
  ]
}
