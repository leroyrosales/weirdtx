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
 *   node scripts/fill-images-wikimedia.mjs --places-only
 *   node scripts/fill-images-wikimedia.mjs --events-only --limit 20 --sleep-ms 4000
 *   node scripts/fill-images-wikimedia.mjs --slug leander-dinosaur-tracks
 *   node scripts/fill-images-wikimedia.mjs --slug eeyores-birthday --kind event
 *   node scripts/fill-images-wikimedia.mjs --file src/content/places/leander-dinosaur-tracks.md
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml, stringify } from 'yaml'

const ROOT = join(import.meta.dirname, '..')
const ALL_CONTENT_DIRS = [
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
  const args = {
    limit: Infinity,
    offset: 0,
    sleepMs: 3000,
    cooldownMs: 10 * 60 * 1000,
    placesOnly: false,
    eventsOnly: false,
    slug: null,
    file: null,
    kind: null, // 'place' | 'event' | null
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit') args.limit = Number(argv[++i])
    else if (a === '--offset') args.offset = Number(argv[++i])
    else if (a === '--sleep-ms') args.sleepMs = Number(argv[++i])
    else if (a === '--cooldown-ms') args.cooldownMs = Number(argv[++i])
    else if (a === '--places-only') args.placesOnly = true
    else if (a === '--events-only') args.eventsOnly = true
    else if (a === '--slug') args.slug = String(argv[++i] ?? '').trim() || null
    else if (a === '--file') args.file = String(argv[++i] ?? '').trim() || null
    else if (a === '--kind') args.kind = String(argv[++i] ?? '').trim().toLowerCase() || null
  }
  if (args.placesOnly && args.eventsOnly) {
    console.error('Use only one of --places-only or --events-only.')
    process.exit(1)
  }
  if (args.slug && args.file) {
    console.error('Use only one of --slug or --file.')
    process.exit(1)
  }
  if (args.kind && args.kind !== 'place' && args.kind !== 'event') {
    console.error('Invalid --kind. Use "place" or "event".')
    process.exit(1)
  }
  if (args.kind && (args.placesOnly || args.eventsOnly)) {
    console.error('Do not combine --kind with --places-only/--events-only.')
    process.exit(1)
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

async function commonsBestFileTitle(q) {
  const j = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    list: 'search',
    srsearch: q,
    srnamespace: 6, // File:
    srlimit: 5,
  })
  const results = j?.query?.search ?? []
  return results[0]?.title ? String(results[0].title) : null
}

function cacheKeyFromFrontmatter(data) {
  const title = String(data.title ?? '').trim()
  const city = String(data.city ?? '').trim()
  // City helps disambiguate (e.g. “Cathedral”).
  return `${title}, ${city}`.trim()
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
  if (wikiTitle) {
    const { qid, pageUrl } = await wikidataItemForWikipediaTitle(wikiTitle)
    if (qid) {
      const commonsFile = await commonsFileFromWikidataP18(qid)
      if (commonsFile) {
        const info = await commonsImageInfo(commonsFile)
        if (info.imageUrl) {
          return {
            url: info.imageUrl,
            alt: title,
            credit: info.artist,
            sourceUrl: info.filePageUrl ?? pageUrl ?? undefined,
            license: info.license,
          }
        }
      }
    }
  }

  // Final fallback: search Wikimedia Commons directly for a matching File:
  // Useful when a good Commons photo exists but isn't surfaced via the Wikipedia/Wikidata paths.
  const commonsQueries = [
    city ? `${title} ${city} TX` : null,
    city ? `${title} ${city}` : null,
    `${title} Texas`,
    title,
  ].filter(Boolean)

  for (const cq of commonsQueries) {
    const fileTitle = await commonsBestFileTitle(cq)
    if (!fileTitle) continue
    const info = await commonsImageInfo(fileTitle)
    if (!info.imageUrl) continue
    return {
      url: info.imageUrl,
      alt: title,
      credit: info.artist,
      sourceUrl: info.filePageUrl ?? undefined,
      license: info.license,
    }
  }

  return null
}

function contentDirsForArgs(args) {
  if (args.kind) return ALL_CONTENT_DIRS.filter((e) => e.kind === args.kind)
  if (args.placesOnly) return ALL_CONTENT_DIRS.filter((e) => e.kind === 'place')
  if (args.eventsOnly) return ALL_CONTENT_DIRS.filter((e) => e.kind === 'event')
  return ALL_CONTENT_DIRS
}

function resolveSingleTarget(args, contentDirs) {
  if (!args.slug && !args.file) return null

  if (args.file) {
    const fp = args.file.startsWith('/') ? args.file : join(ROOT, args.file)
    if (!fp.endsWith('.md')) {
      console.error('Target file must be a .md file.')
      process.exit(1)
    }
    if (!existsSync(fp)) {
      console.error(`Target file not found: ${args.file}`)
      process.exit(1)
    }
    const dirEntry = contentDirs.find(({ dir }) => fp.startsWith(dir))
    if (!dirEntry) {
      console.error('Target file must be under src/content/places or src/content/events.')
      process.exit(1)
    }
    return [{ fp, kind: dirEntry.kind }]
  }

  const filename = `${args.slug}.md`
  /** @type {{ fp: string; kind: string }[]} */
  const hits = []
  for (const { dir, kind } of contentDirs) {
    const fp = join(dir, filename)
    if (existsSync(fp)) hits.push({ fp, kind })
  }
  if (hits.length === 0) {
    console.error(`No markdown file found for slug "${args.slug}". Expected ${filename} under content directories.`)
    process.exit(1)
  }
  if (hits.length > 1) {
    console.error(
      `Slug "${args.slug}" matched multiple files (place + event). Re-run with --kind place|event or use --file.`,
    )
    process.exit(1)
  }
  return hits
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const { limit, offset, sleepMs, cooldownMs } = args
  const contentDirs = contentDirsForArgs(args)
  const cache = loadCache()

  function normalizeError(e) {
    /** @type {any} */
    const err = e
    const status = typeof err === 'object' && err && 'status' in err ? Number(err.status) : undefined

    // Node's fetch() often throws TypeError('fetch failed') with a nested `cause` that has the real info.
    const cause = typeof err === 'object' && err ? err.cause : undefined
    const causeObj =
      cause && typeof cause === 'object'
        ? {
            name: cause.name,
            message: cause.message,
            code: cause.code,
            errno: cause.errno,
            syscall: cause.syscall,
            hostname: cause.hostname,
            address: cause.address,
            port: cause.port,
          }
        : cause
          ? { value: String(cause) }
          : undefined

    return {
      status,
      cacheEntry: {
        status: 'error',
        error: String(err),
        errorName: typeof err === 'object' && err ? err.name : undefined,
        errorMessage: typeof err === 'object' && err ? err.message : undefined,
        httpStatus: Number.isFinite(status) ? status : undefined,
        cause: causeObj,
        at: new Date().toISOString(),
      },
      consoleLine: {
        error: String(err),
        httpStatus: Number.isFinite(status) ? status : undefined,
        cause: causeObj,
      },
    }
  }

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

  const single = resolveSingleTarget(args, contentDirs)
  const dirIterations = single
    ? [{ dir: null, kind: null, files: single.map((s) => ({ fp: s.fp, kind: s.kind })) }]
    : contentDirs.map(({ dir, kind }) => ({
        dir,
        kind,
        files: readdirSync(dir)
          .filter((n) => n.endsWith('.md'))
          .sort()
          .map((name) => ({ fp: join(dir, name), kind })),
      }))

  for (const batch of dirIterations) {
    for (const { fp, kind } of batch.files) {
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
        const norm = normalizeError(e)
        const status = norm.status
        cache[key] = norm.cacheEntry
        console.log(JSON.stringify({ note: 'image lookup error', key, ...norm.consoleLine }, null, 2))

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
        scope: args.placesOnly ? 'places' : args.eventsOnly ? 'events' : 'places+events',
        target: args.slug ? { slug: args.slug, kind: args.kind ?? null } : args.file ? { file: args.file } : null,
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

