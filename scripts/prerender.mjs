/**
 * After `vite build` (client) + `vite build --ssr`, renders each sitemap URL to static HTML
 * so crawlers and previews get real content without executing JS.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const DIST = join(ROOT, 'dist')
const SITEMAP = join(DIST, 'sitemap.xml')
const SERVER_ENTRY = join(DIST, 'server', 'entry-server.js')

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function safeJsonLd(obj) {
  if (obj == null) return ''
  const raw = JSON.stringify(obj)
  return raw.replace(/</g, '\\u003c')
}

function injectHead(html, { fullTitle, description, canonicalUrl, noIndex, ogImage, jsonLd }) {
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escAttr(fullTitle)}</title>`)
  out = out.replace(
    /<meta\s+[^>]*name="description"[^>]*\/?>/is,
    `<meta name="description" content="${escAttr(description)}" />`,
  )
  out = out.replace(
    /<meta\s+[^>]*name="robots"[^>]*\/?>/i,
    `<meta name="robots" content="${noIndex ? 'noindex, nofollow' : 'index, follow'}" />`,
  )

  const twCard = ogImage ? 'summary_large_image' : 'summary'
  const ogImgLine = ogImage
    ? `    <meta property="og:image" content="${escAttr(ogImage)}" />\n    <meta name="twitter:image" content="${escAttr(ogImage)}" />\n`
    : ''

  const ldLine = jsonLd
    ? `    <script type="application/ld+json" data-weirdtx-prerender>${safeJsonLd(jsonLd)}</script>\n`
    : ''

  const block = `
    <link rel="canonical" href="${escAttr(canonicalUrl)}" data-weirdtx-prerender />
    <meta property="og:title" content="${escAttr(fullTitle)}" />
    <meta property="og:description" content="${escAttr(description)}" />
    <meta property="og:url" content="${escAttr(canonicalUrl)}" />
    <meta property="og:site_name" content="Weird TX" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="en_US" />
${ogImgLine}    <meta name="twitter:card" content="${twCard}" />
    <meta name="twitter:title" content="${escAttr(fullTitle)}" />
    <meta name="twitter:description" content="${escAttr(description)}" />
${ldLine}`

  out = out.replace('</head>', `${block}  </head>`)
  return out
}

function outFileForPathname(distDir, pathname) {
  const p = (pathname.split('?')[0].replace(/\/$/, '') || '/').toLowerCase()
  if (p === '/') return join(distDir, 'index.html')
  const segments = p.split('/').filter(Boolean)
  return join(distDir, ...segments, 'index.html')
}

function ensureDir(file) {
  const d = dirname(file)
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
}

async function main() {
  if (!existsSync(SITEMAP)) {
    console.error('prerender: missing dist/sitemap.xml; run client vite build first')
    process.exit(1)
  }
  if (!existsSync(SERVER_ENTRY)) {
    console.error('prerender: missing dist/server/entry-server.js; run SSR build first')
    process.exit(1)
  }

  const template = readFileSync(join(DIST, 'index.html'), 'utf8')

  const { renderRouteHtml } = await import(pathToFileURL(SERVER_ENTRY).href)

  const sitemapXml = readFileSync(SITEMAP, 'utf8')
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim())

  if (locs.length === 0) {
    console.error('prerender: no <loc> entries in sitemap')
    process.exit(1)
  }

  const siteOrigin = new URL(locs[0]).origin
  let ok = 0

  for (const loc of locs) {
    const u = new URL(loc)
    const pathname = u.pathname || '/'
    const { appHtml, head } = renderRouteHtml(pathname, siteOrigin)
    const fullTitle = `${head.pageTitleShort} · Weird TX`

    let page = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`,
    )
    page = injectHead(page, {
      fullTitle,
      description: head.description,
      canonicalUrl: head.canonicalUrl,
      noIndex: head.noIndex,
      ogImage: head.ogImage,
      jsonLd: head.jsonLd,
    })

    const target = outFileForPathname(DIST, pathname)
    ensureDir(target)
    writeFileSync(target, page, 'utf8')
    ok++
  }

  console.log(`prerender: wrote ${ok} HTML files under dist/ (origin ${siteOrigin})`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
