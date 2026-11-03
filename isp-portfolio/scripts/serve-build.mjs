// Menyajikan build/client seperti Cloudflare Pages untuk uji lokal: header dari
// `_headers` (pola /* dan /dir/*), /path → /path/index.html, URL tak dikenal →
// 404.html berstatus 404. Jalankan setelah build: npm run preview:cf
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const client = fileURLToPath(new URL('../build/client', import.meta.url))
const port = Number(process.env.PORT ?? 4175)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

/** Aturan _headers: [{ pattern, headers: [[nama, nilai]] }] */
const rules = []
for (const line of readFileSync(join(client, '_headers'), 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue
  if (!/^\s/.test(line)) rules.push({ pattern: line.trim(), headers: [] })
  else {
    const i = line.indexOf(':')
    rules.at(-1)?.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()])
  }
}
const matches = (pattern, path) => (pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : path === pattern)

function resolve(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  for (const candidate of [safe, join(safe, 'index.html'), `${safe}.html`]) {
    const file = join(client, candidate)
    if (file.startsWith(client) && existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}

createServer((req, res) => {
  const path = new URL(req.url ?? '/', 'http://x').pathname
  const file = resolve(path)
  for (const r of rules) if (matches(r.pattern, path)) for (const [k, v] of r.headers) res.setHeader(k, v)
  const target = file ?? join(client, '404.html')
  res.writeHead(file ? 200 : 404, { 'Content-Type': TYPES[extname(target)] ?? 'application/octet-stream' })
  createReadStream(target).pipe(res)
}).listen(port, () => console.log(`build/client → http://localhost:${port}`))
