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
}

/** Meta, canonical, dan Open Graph unik per halaman (PRD US-10 AC 2). */
export function pageMeta({ title, description = site.seo.description, path, noindex }: PageMeta): MetaDescriptor[] {
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
    { name: 'twitter:card', content: 'summary_large_image' },
    ...(noindex ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
  ]
}
