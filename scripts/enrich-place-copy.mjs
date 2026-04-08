/**
 * Fill empty `teaser` and body copy for place markdown files.
 * Skips files that already have a non-trivial teaser and body.
 *
 * Run: node scripts/enrich-place-copy.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml, stringify } from 'yaml'

const PLACES_DIR = join(import.meta.dirname, '../src/content/places')

const KEY_ORDER = [
  'title',
  'city',
  'region',
  'lat',
  'lng',
  'category',
  'tags',
  'featured',
  'teaser',
  'address',
  'url',
]

function parseMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return null
  const [, yamlBlock, body] = match
  let data = {}
  try {
    const parsed = parseYaml(yamlBlock)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed
    }
  } catch {
    return null
  }
  return { data, yamlBlock, body: body.trimEnd(), full: raw }
}

function needsTeaser(data) {
  const t = data.teaser
  if (t == null) return true
  return String(t).trim().length < 8
}

function needsBody(body) {
  const stripped = body.replace(/\s+/g, ' ').trim()
  return stripped.length < 45
}

function needsCategory(data) {
  const c = data.category
  return c == null || String(c).trim().length === 0
}

function inferKind(title, slug) {
  const s = `${title} ${slug}`.toLowerCase()
  if (/\b(grave|gravesite|cemetery|crypt|tomb|burial|funeral|cathedral of junk)\b/.test(s))
    return 'cemetery'
  if (/\b(museum|gallery)\b/.test(s)) return 'museum'
  if (
    /\b(park|garden|preserve|trail|canyon|lake|springs?|creek|swamp|forest|woods|bayou|wetland|peak|sinkhole|cavern|bat colony|reservoir|dunes|island)\b/.test(
      s,
    )
  )
    return 'outdoors'
  if (
    /\b(restaurant|cafe|café|bbq|kitchen|bakery|cantina|taco|diner|bar|seafood|kolache|brewery|steak|eatery|food shark)\b/.test(
      s,
    )
  )
    return 'food'
  if (/\b(mural|sculpture|statue|mosaic)\b/.test(s)) return 'publicArt'
  if (/\b(bridge|tower|building|opera|hotel|inn|house|castle|fort|stockyards|skyspace|skyscraper)\b/.test(s))
    return 'structure'
  if (/\b(drive-in|theatre|theater)\b/.test(s)) return 'entertainment'
  if (/\b(church|chapel|cathedral|temple|shrine)\b/.test(s)) return 'sacred'
  if (/\b(market|shop|store|books)\b/.test(s)) return 'retail'
  if (/\b(monument|memorial)\b/.test(s)) return 'memorial'
  if (/\b(ghost|haunt|legend|alien|ufo)\b/.test(s)) return 'folklore'
  return 'general'
}

function categoryFromKind(kind) {
  switch (kind) {
    case 'cemetery':
      return 'Cemetery'
    case 'museum':
      return 'Museum'
    case 'outdoors':
      return 'Outdoors'
    case 'food':
      return 'Food & Drink'
    case 'publicArt':
      return 'Public Art'
    case 'structure':
      return 'Structure'
    case 'entertainment':
      return 'Entertainment'
    case 'sacred':
      return 'Sacred Site'
    case 'retail':
      return 'Shop'
    case 'memorial':
      return 'Memorial'
    case 'folklore':
      return 'Folklore'
    default:
      return undefined
  }
}

function copyForKind(kind, title, city, region) {
  const c = city.trim() || 'Texas'
  const r = region.trim() || 'Texas'
  /** @type {Record<string, { teaser: string; body: string }>} */
  const m = {
    cemetery: {
      teaser: `${title}, quiet history under open sky in ${c}, ${r}.`,
      body: `**${title}** is part of the layered story of **${c}** and **${r}**: names, dates, and the small monuments people leave behind.

Respect posted rules, keep voices low, and double-check access before you visit. Rural and urban cemeteries alike can have limited hours.`,
    },
    museum: {
      teaser: `Exhibits and odd collections in ${c}, a ${r} stop for curious minds.`,
      body: `**${title}** adds texture to **${c}** (${r}): local history, niche obsessions, and the kind of detail you only get by standing in the room.

Call ahead or check the venue’s site for tickets, closures, and photography rules. Small museums rotate shows and hours often.`,
    },
    outdoors: {
      teaser: `${title}, ${r} landscape and fresh air near ${c}.`,
      body: `**${title}** sits in the **${r}** country around **${c}**. Weather, seasons, and trail conditions can change fast out here.

Pack water, mind burn bans and wildlife, and confirm park or preserve hours before you drive, especially for swimming holes and remote sites.`,
    },
    food: {
      teaser: `${title} in ${c}, flavor and ${r} road-trip fuel.`,
      body: `**${title}** is a **${c}** pit stop in **${r}**: the kind of place that turns “we should grab something” into a story.

Menus and hours shift; weekends and holidays get weird. A quick call or peek at their latest posts saves a hungry wrong turn.`,
    },
    publicArt: {
      teaser: `${title}, public art and photo ops in ${c}, ${r}.`,
      body: `**${title}** lives in plain sight in **${c}** (${r}): color, scale, and the occasional inside joke baked into the streetscape.

Lighting and crowds change the shot. If it’s on private property, be polite, don’t block driveways, and move along if someone asks.`,
    },
    structure: {
      teaser: `${title}, built character in ${c}, ${r}.`,
      body: `**${title}** is part of **${c}**’s skyline or street grid in **${r}**: engineering, ego, or both.

Access varies. Some spots are exterior-only. Check whether tours or tickets are required before you plan around going inside.`,
    },
    entertainment: {
      teaser: `${title}, lights, lore, or a night out in ${c}, ${r}.`,
      body: `**${title}** is a **${c}** hangout in **${r}** where the show (or the sign out front) is half the draw.

Seasonal schedules and renovations happen. Confirm what’s playing, what’s open, and whether cash is still king at the box office.`,
    },
    sacred: {
      teaser: `${title} in ${c}, ${r} faith, stone, and community.`,
      body: `**${title}** anchors **${c}** (${r}) for worshippers and visitors alike. Treat it as a living site, not just a backdrop.

Step quietly during services, dress modestly if asked, and skip the flash; many sanctuaries restrict photography.`,
    },
    retail: {
      teaser: `${title}, browse something you didn’t know you needed in ${c}.`,
      body: `**${title}** is a **${c}** browse in **${r}**: stock changes, and the best finds rarely ship.

Small shops keep odd hours. If you’re making a pilgrimage, call first, especially mid-week or after holidays.`,
    },
    memorial: {
      teaser: `${title}, ${r} remembers, in ${c}.`,
      body: `**${title}** marks a moment or a life tied to **${c}** and **${r}**. Worth slowing down for, even if you only read the plaque once.

Sites on public land are usually dawn-to-dusk; roadside markers are pull-off quickies. Watch traffic and private property lines.`,
    },
    folklore: {
      teaser: `${title}, ${r} legend, tall tale, or roadside whispers near ${c}.`,
      body: `**${title}** sits in the **${c}** orbit of **${r}** lore: the sort of story that grows every time someone retells it after midnight.

Go for the atmosphere, not the guarantee. Respect neighbors, don’t trespass, and remember the best version is often the one told on the drive home.`,
    },
    general: {
      teaser: `${title} in ${c}, a ${r} detour for odd-Texas hunters.`,
      body: `**${title}** is one of those **${c}** stops that makes **${r}** feel bigger than the postcard: a little history, a little weird, and a good excuse to pull over.

Details drift: hours, admission, and what’s still standing can change. Verify before you go, especially for rural pins and one-off attractions.`,
    },
  }
  return m[kind] ?? m.general
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

let updated = 0
const skipped = []
const failed = []

for (const name of readdirSync(PLACES_DIR)) {
  if (!name.endsWith('.md')) continue
  const fp = join(PLACES_DIR, name)
  const raw = readFileSync(fp, 'utf8')
  const parsed = parseMatter(raw)
  if (!parsed) {
    failed.push(name)
    continue
  }

  const { data, body } = parsed
  const nt = needsTeaser(data)
  const nb = needsBody(body)
  const nc = needsCategory(data)
  if (!nt && !nb && !nc) {
    skipped.push(name)
    continue
  }

  const title = String(data.title ?? name.replace(/\.md$/i, '')).trim()
  const city = String(data.city ?? '').trim()
  const region = String(data.region ?? '').trim()
  const slug = name.replace(/\.md$/i, '')

  const kind = inferKind(title, slug)
  const { teaser, body: newBody } = copyForKind(kind, title, city, region)

  const next = { ...data }
  if (nc) {
    next.category = categoryFromKind(kind)
  }
  if (nt) next.teaser = teaser
  const finalBody = nb ? newBody : body

  const yamlText = serializeFrontmatter(next)
  const out = `---\n${yamlText}\n---\n\n${finalBody.trim()}\n`
  writeFileSync(fp, out, 'utf8')
  updated++
}

console.log(`Enriched ${updated} place files (teaser and/or body).`)
console.log(`Skipped ${skipped.length} (already had teaser + body).`)
if (failed.length) {
  console.log(`Failed to parse ${failed.length} files:`)
  failed.slice(0, 20).forEach((f) => console.log(`  - ${f}`))
  if (failed.length > 20) console.log(`  … and ${failed.length - 20} more`)
}
