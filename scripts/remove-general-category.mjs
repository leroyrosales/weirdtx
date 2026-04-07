/**
 * Remove `category: General` from content frontmatter (places + events).
 *
 * Run:
 *   node scripts/remove-general-category.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml, stringify } from 'yaml'

const ROOT = join(import.meta.dirname, '..')
const DIRS = [join(ROOT, 'src/content/places'), join(ROOT, 'src/content/events')]

const KEY_ORDER = [
  'title',
  'city',
  'region',
  'lat',
  'lng',
  'starts',
  'ends',
  'category',
  'tags',
  'featured',
  'teaser',
  'address',
  'url',
  'image',
]

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

let updated = 0
let scanned = 0

for (const dir of DIRS) {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md')) continue
    const fp = join(dir, name)
    const raw = readFileSync(fp, 'utf8')
    const parsed = parseMatter(raw)
    scanned++
    if (!parsed) continue
    const { data, body } = parsed
    if (String(data.category ?? '').trim() !== 'General') continue
    delete data.category
    const yamlText = serializeFrontmatter(data)
    const out = `---\n${yamlText}\n---\n\n${body.trim()}\n`
    writeFileSync(fp, out, 'utf8')
    updated++
  }
}

console.log(`Removed General category from ${updated} files (scanned ${scanned}).`)

