/**
 * Fill `image:` frontmatter for places/events using Wikipedia → Wikidata P18 → Wikimedia Commons.
 *
 * Notes:
 * - Only updates entries that do NOT already have `image.url`.
 * - Best-effort: skips when no Wikipedia/Wikidata image is found.
 * - Rate-limited + cached to avoid hammering the API.
 *
 * Usage:
 *   node scripts/fill-images-wikimedia.mjs
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml, stringify } from 'yaml'

const ROOT = join(import.meta.dirname, '..')
const CONTENT_DIRS = [
  { dir: join(ROOT, 'src/content/places'), kind: 'place' },
  { dir: join(ROOT, 'src/content/events'), kind: 'event' },
]

const CACHE_DIR = join(ROOT, '.cache')
const CACHE_FILE = join(CACHE_DIR, 'wikimedia-image-suggestions.json')

const KEY_ORDER = [
  'title',
  'city',
  'region',
  'lat',
  'lng',
  'starts',
  'ends',
  'tags',
  'featured',
  'teaser',
  'address',
  'url',
  'image',
]

function parseArgs(argv) {
  const args = { limit: Infinity, offset: 0, sleepMs: 3000, cooldownMs: 10 * 60 * 1000 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit') args.limit = Number(argv[++i])
    else if (a === '--offset') args.offset = Number(argv[++i])
    else if (a === '--sleep-ms') args.sleepMs = Number(argv[++i])
    else if (a === '--cooldown-ms') args.cooldownMs = Number(argv[++i])
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = Infinity
  if (!Number.isFinite(args.offset) || args.offset < 0) args.offset = 0
  if (!Number.isFinite(args.sleepMs) || args.sleepMs < 0) args.sleepMs = 3000
  if (!Number.isFinite(args.cooldownMs) || args.cooldownMs < 0) args.cooldownMs = 10 * 60 * 1000
  return args
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return null
  const [, yamlBlock, body] = match
  let data = {}
  try {
    const parsed = parseYaml(yamlBlock)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed
  } catch {
    return null
  }
  return { data, body: body.trimEnd() }
}

function orderFrontmatter(data) {
  const out = {}
  for (const k of KEY_ORDER) {
    if (data[k] !== undefined) out[k] = data[k]
  }
  for (const k of Object.keys(data)) {
    if (!(k in out)) out[k] = data[k]
  }
  return out
}

function serializeFrontmatter(data) {
  return stringify(orderFrontmatter(data), {
    lineWidth: 100,
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  }).trimEnd()
}

async function api(base, params, { retries = 6 } = {}) {
  const url = new URL(base)
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))

  // Wikimedia APIs can rate limit (429). Use exponential backoff.
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'weirdtx (content tool)' } })
    if (res.ok) return await res.json()

    const retryable = res.status === 429 || res.status === 503
    if (!retryable || attempt === retries) {
      const err = new Error(`HTTP ${res.status}`)
      // @ts-expect-error attach status for control flow
      err.status = res.status
      throw err
    }

    const backoffMs = Math.min(15000, 800 * 2 ** attempt) + Math.floor(Math.random() * 350)
    await sleep(backoffMs)
  }

  throw new Error('Unreachable')
}

async function wikipediaBestTitle(q) {
  const j = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    list: 'search',
    srsearch: q,
    srlimit: 1,
  })
  const results = j?.query?.search ?? []
  return results[0]?.title ? String(results[0].title) : null
}

async function wikidataItemForWikipediaTitle(pageTitle) {
  const j = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    prop: 'pageprops|info',
    titles: pageTitle,
    inprop: 'url',
  })
  const pages = j?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  const qid = page?.pageprops?.wikibase_item ? String(page.pageprops.wikibase_item) : null
  const pageUrl = page?.fullurl ? String(page.fullurl) : null
  return { qid, pageUrl }
}

async function commonsFileFromWikidataP18(qid) {
  const j = await api('https://www.wikidata.org/w/api.php', {
    action: 'wbgetentities',
    ids: qid,
    props: 'claims',
  })
  const ent = j?.entities?.[qid]
  const p18 = ent?.claims?.P18?.[0]?.mainsnak?.datavalue?.value
  if (!p18) return null
  return `File:${p18}`
}

async function commonsImageInfo(fileTitle) {
  const j = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    prop: 'imageinfo|info',
    titles: fileTitle,
    iiprop: 'url|extmetadata',
    iiurlwidth: 1600,
    inprop: 'url',
  })
  const pages = j?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  const ii = page?.imageinfo?.[0]
  const meta = ii?.extmetadata ?? {}
  return {
    imageUrl: ii?.thumburl ? String(ii.thumburl) : ii?.url ? String(ii.url) : undefined,
    filePageUrl: page?.fullurl ? String(page.fullurl) : undefined,
    artist: meta.Artist?.value ? String(meta.Artist.value).replace(/<[^>]+>/g, '').trim() : undefined,
    license: meta.LicenseShortName?.value ? String(meta.LicenseShortName.value).trim() : undefined,
  }
}

async function wikipediaSearchWithThumbnail(q) {
  const j = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    generator: 'search',
    gsrsearch: q,
    gsrlimit: 1,
    prop: 'pageimages|info',
    piprop: 'thumbnail',
    pithumbsize: 1600,
    inprop: 'url',
  })
  const pages = j?.query?.pages ?? {}
  const page = Object.values(pages)[0]
  if (!page) return null
  return {
    wikiUrl: page?.fullurl ? String(page.fullurl) : undefined,
    thumbUrl: page?.thumbnail?.source ? String(page.thumbnail.source) : undefined,
    pageImage: page?.pageimage ? String(page.pageimage) : undefined,
  }
}

function cacheKeyFromFrontmatter(data) {
  const title = String(data.title ?? '').trim()
  const city = String(data.city ?? '').trim()
  // City helps disambiguate (e.g. “Cathedral”).
  return `${title} — ${city}`.trim()
}

function loadCache() {
  if (!existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR)
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n', 'utf8')
}

async function suggestImage(data) {
  const title = String(data.title ?? '').trim()
  const city = String(data.city ?? '').trim()
  if (!title) return null

  // Query heuristics: add Texas + city if present.
  const q = city ? `${title} ${city} Texas` : `${title} Texas`

  // Fast path: one Wikipedia request for search + thumbnail + image filename.
  const wiki = await wikipediaSearchWithThumbnail(q)
  if (wiki?.thumbUrl && wiki?.pageImage) {
    const commonsFile = `File:${wiki.pageImage}`
    const info = await commonsImageInfo(commonsFile)
    return {
      url: wiki.thumbUrl,
      alt: title,
      credit: info.artist,
      sourceUrl: info.filePageUrl ?? wiki.wikiUrl ?? undefined,
      license: info.license,
    }
  }

  // Fallback path: Wikipedia title → Wikidata → P18 → Commons.
  const wikiTitle = await wikipediaBestTitle(q)
  if (!wikiTitle) return null
  const { qid, pageUrl } = await wikidataItemForWikipediaTitle(wikiTitle)
  if (!qid) return null
  const commonsFile = await commonsFileFromWikidataP18(qid)
  if (!commonsFile) return null
  const info = await commonsImageInfo(commonsFile)
  if (!info.imageUrl) return null
  return {
    url: info.imageUrl,
    alt: title,
    credit: info.artist,
    sourceUrl: info.filePageUrl ?? pageUrl ?? undefined,
    license: info.license,
  }
}

async function main() {
  const { limit, offset, sleepMs, cooldownMs } = parseArgs(process.argv.slice(2))
  const cache = loadCache()

  let scanned = 0
  let eligible = 0
  let attempted = 0
  let updated = 0
  let skippedAlready = 0
  let skippedNoMatch = 0
  let failedParse = 0
  let errors = 0
  let rateLimited = 0
  let offsetSkipped = 0

  for (const { dir, kind } of CONTENT_DIRS) {
    const files = readdirSync(dir).filter((n) => n.endsWith('.md')).sort()
    for (const name of files) {
      if (!name.endsWith('.md')) continue
      const fp = join(dir, name)
      const raw = readFileSync(fp, 'utf8')
      const parsed = parseMatter(raw)
      scanned++

      if (!parsed) {
        failedParse++
        continue
      }

      const { data, body } = parsed
      const existingUrl = data?.image && typeof data.image === 'object' ? data.image.url : undefined
      if (existingUrl) {
        skippedAlready++
        continue
      }

      const key = `${kind}:${cacheKeyFromFrontmatter(data)}`
      if (cache[key]?.status === 'no_match') {
        skippedNoMatch++
        continue
      }

      eligible++
      if (eligible <= offset) {
        offsetSkipped++
        continue
      }
      if (attempted >= limit) break
      attempted++

      try {
        const suggestion = await suggestImage(data)
        if (!suggestion) {
          cache[key] = { status: 'no_match', at: new Date().toISOString() }
          skippedNoMatch++
          continue
        }

        data.image = suggestion
        const yamlText = serializeFrontmatter(data)
        const out = `---\n${yamlText}\n---\n\n${body.trim()}\n`
        writeFileSync(fp, out, 'utf8')
        cache[key] = { status: 'ok', image: suggestion, at: new Date().toISOString() }
        updated++

        await sleep(sleepMs)
        if (attempted % 25 === 0) saveCache(cache)
      } catch (e) {
        errors++
        const status = typeof e === 'object' && e && 'status' in e ? Number(e.status) : undefined
        cache[key] = {
          status: 'error',
          error: String(e),
          httpStatus: Number.isFinite(status) ? status : undefined,
          at: new Date().toISOString(),
        }

        if (status === 429) {
          rateLimited++
          // Cool down, then keep going.
          saveCache(cache)
          console.log(
            JSON.stringify(
              { note: 'Rate limited (429). Cooling down...', cooldownMs, attempted, updated, errors },
              null,
              2,
            ),
          )
          await sleep(cooldownMs)
          continue
        }

        await sleep(Math.max(2000, sleepMs))
      }
    }
    if (attempted >= limit) break
  }

  saveCache(cache)
  console.log(
    JSON.stringify(
      {
        scanned,
        eligible,
        offset,
        offsetSkipped,
        limit: Number.isFinite(limit) ? limit : null,
        attempted,
        updated,
        skippedAlready,
        skippedNoMatch,
        errors,
        rateLimited,
        failedParse,
        cacheFile: CACHE_FILE,
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

