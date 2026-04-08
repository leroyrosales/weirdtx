/**
 * Writes public/sitemap.xml before build. Netlify sets URL; override with SITE_URL.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = join(import.meta.dirname, '..')
const PUBLIC = join(ROOT, 'public')
const PLACES = join(ROOT, 'src/content/places')
const EVENTS = join(ROOT, 'src/content/events')

const REGIONS = [
  'Panhandle',
  'West Texas',
  'Hill Country',
  'Central Texas',
  'DFW',
  'East Texas',
  'Gulf Coast',
  'South Texas',
  'Big Bend',
]

function regionToSlug(region) {
  return region.trim().toLowerCase().replace(/\s+/g, '-')
}

function matter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return {}
  try {
    const o = parseYaml(m[1])
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {}
  } catch {
    return {}
  }
}

function slugFromName(name) {
  return name.replace(/\.md$/i, '')
}

const siteUrl = (
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  process.env.SITE_URL ||
  'https://weirdtx.netlify.app'
).replace(/\/$/, '')

const staticPaths = ['/', '/explore', '/places', '/events']

const urls = new Set()

for (const p of staticPaths) {
  urls.add(`${siteUrl}${p === '/' ? '/' : p}`)
}

for (const r of REGIONS) {
  urls.add(`${siteUrl}/regions/${regionToSlug(r)}`)
}

for (const f of readdirSync(PLACES).filter((n) => n.endsWith('.md'))) {
  urls.add(`${siteUrl}/places/${slugFromName(f)}`)
}

for (const f of readdirSync(EVENTS).filter((n) => n.endsWith('.md'))) {
  urls.add(`${siteUrl}/events/${slugFromName(f)}`)
}

const tagSet = new Set()
const categorySet = new Set()

for (const dir of [PLACES, EVENTS]) {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.md'))) {
    const data = matter(readFileSync(join(dir, f), 'utf8'))
    for (const t of data.tags || []) {
      if (typeof t === 'string' && t.trim()) tagSet.add(t.trim())
    }
    if (typeof data.category === 'string' && data.category.trim()) {
      categorySet.add(data.category.trim())
    }
  }
}

for (const t of tagSet) {
  urls.add(`${siteUrl}/tags/${encodeURIComponent(t)}`)
}
for (const c of categorySet) {
  urls.add(`${siteUrl}/categories/${encodeURIComponent(c)}`)
}

const sorted = [...urls].sort()
const today = new Date().toISOString().slice(0, 10)

const body = sorted
  .map((loc) => {
    const path = new URL(loc).pathname
    const priority =
      path === '/' ? '1.0' : path.split('/').length <= 2 ? '0.85' : path.includes('/places/') || path.includes('/events/') ? '0.75' : '0.65'
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true })
writeFileSync(join(PUBLIC, 'sitemap.xml'), xml, 'utf8')

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`
writeFileSync(join(PUBLIC, 'robots.txt'), robots, 'utf8')
console.log(`sitemap: ${sorted.length} URLs → public/sitemap.xml (base ${siteUrl})`)
console.log(`robots.txt → public/robots.txt`)
