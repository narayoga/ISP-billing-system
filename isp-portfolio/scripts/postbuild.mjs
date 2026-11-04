// Langkah setelah `react-router build` (dipanggil `npm run build`). Semua diturunkan
// dari HTML hasil prerender, jadi tidak ada daftar route kedua yang harus dirawat:
//   1. 404.html  — dari /404 yang di-prerender; Cloudflare Pages menyajikannya dengan
//                  status HTTP 404 untuk URL tak dikenal (tanpa fallback SPA).
//   2. sitemap.xml + robots.txt — dari <link rel="canonical"> tiap halaman yang
//                  tidak bertanda noindex.
//   3. _headers  — hash SHA-256 setiap <script> inline dimasukkan ke CSP.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const client = fileURLToPath(new URL('../build/client', import.meta.url))

// ── 1. Halaman 404 ──
const prerendered404 = join(client, '404', 'index.html')
if (!existsSync(prerendered404)) throw new Error('build/client/404/index.html tidak ada — tambahkan "/404" ke prerender')
renameSync(prerendered404, join(client, '404.html'))
rmSync(join(client, '404'), { recursive: true })
// Tanpa fallback SPA: URL tak dikenal harus 404, bukan 200 (PRD §10, risiko soft-404).
rmSync(join(client, '__spa-fallback.html'), { force: true })

// ── Kumpulkan semua HTML ──
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'assets' ? [] : walk(path)
    return name.endsWith('.html') ? [path] : []
  })
}
const pages = walk(client).map((path) => ({ path, html: readFileSync(path, 'utf8') }))

// ── 2. Sitemap & robots ──
const canonicalOf = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
const indexable = pages.filter((p) => !/<meta name="robots" content="noindex/.test(p.html))
const urls = indexable.map((p) => {
  const url = canonicalOf(p.html)
  if (!url) throw new Error(`Canonical tidak ditemukan: ${relative(client, p.path)}`)
  return url
})
const origin = new URL(urls[0]).origin
if (/localhost|127\.0\.0\.1/.test(origin)) {
  console.warn(`⚠ VITE_SITE_URL belum diisi — canonical & sitemap memakai ${origin}. Set sebelum deploy produksi.`)
}

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .sort()
  .map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`
writeFileSync(join(client, 'sitemap.xml'), sitemap)
writeFileSync(join(client, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /ui-kit\nDisallow: /admin\nDisallow: /tagihan/\n\nSitemap: ${origin}/sitemap.xml\n`)

// ── 3. CSP: hash skrip inline ──
// Blok data (application/ld+json) tidak dieksekusi sehingga tidak perlu di-hash.
const hashes = new Set()
for (const { html } of pages) {
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /application\/ld\+json/.test(attrs) || !body) continue
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
  }
}
const headersPath = join(client, '_headers')
const headers = readFileSync(headersPath, 'utf8')
if (!headers.includes('__SCRIPT_HASHES__')) throw new Error('Placeholder __SCRIPT_HASHES__ tidak ada di _headers')
const finalHeaders = headers.replace('__SCRIPT_HASHES__', [...hashes].sort().join(' '))
// Cloudflare Pages membatasi nilai satu header 2000 karakter.
const csp = finalHeaders.match(/Content-Security-Policy: (.*)/)?.[1] ?? ''
if (csp.length > 2000) throw new Error(`CSP ${csp.length} karakter, melebihi batas 2000 Cloudflare`)
writeFileSync(headersPath, finalHeaders)

console.log(`postbuild: 404.html, sitemap.xml (${urls.length} URL), robots.txt, CSP (${hashes.size} hash skrip, ${csp.length} karakter)`)
