/**
 * One-off / maintenance: replace invalid `region: Texas` in place markdown with a valid Region.
 * Run: node scripts/fix-place-regions.mjs
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'

const PLACES_DIR = join(import.meta.dirname, '../src/content/places')

const REGIONS = new Set([
  'Panhandle',
  'West Texas',
  'Hill Country',
  'Central Texas',
  'DFW',
  'East Texas',
  'Gulf Coast',
  'South Texas',
  'Big Bend',
])

/** @type {Record<string, string>} */
const CITY_TO_REGION = {
  Alpine: 'Big Bend',
  Amarillo: 'Panhandle',
  'Aransas Pass': 'Gulf Coast',
  'Archer City': 'DFW',
  Arlington: 'DFW',
  Aurora: 'DFW',
  Austin: 'Central Texas',
  Balmorhea: 'West Texas',
  Bastrop: 'Central Texas',
  Baytown: 'Gulf Coast',
  Beaumont: 'Gulf Coast',
  Bellaire: 'Gulf Coast',
  Bellville: 'Central Texas',
  'Big Bend National Park': 'Big Bend',
  Boerne: 'Hill Country',
  Bowie: 'Panhandle',
  Brackettville: 'South Texas',
  Bronson: 'East Texas',
  Brownsville: 'South Texas',
  Burnet: 'Hill Country',
  Bushland: 'Panhandle',
  Canadian: 'Panhandle',
  Canyon: 'Panhandle',
  Carrollton: 'DFW',
  Carthage: 'East Texas',
  'Cedar Creek': 'Central Texas',
  Cisco: 'Central Texas',
  Clarksville: 'East Texas',
  'College Station': 'Central Texas',
  Columbus: 'Central Texas',
  Comfort: 'Hill Country',
  Comstock: 'West Texas',
  Conroe: 'Gulf Coast',
  Converse: 'South Texas',
  'Corpus Christi': 'Gulf Coast',
  Corsicana: 'Central Texas',
  'Cross Plains': 'Central Texas',
  'Culberson County': 'Big Bend',
  Dale: 'Central Texas',
  Dallas: 'DFW',
  Denton: 'DFW',
  Dublin: 'Central Texas',
  Eastland: 'Central Texas',
  Edinburg: 'South Texas',
  'El Paso': 'West Texas',
  Fairmont: 'Gulf Coast',
  Florence: 'Central Texas',
  Floydada: 'Panhandle',
  'Fort Davis': 'Big Bend',
  'Fort Stockton': 'West Texas',
  'Fort Worth': 'DFW',
  Fredericksburg: 'Hill Country',
  Freeport: 'Gulf Coast',
  Gainesville: 'DFW',
  Galveston: 'Gulf Coast',
  'Glen Rose': 'DFW',
  Goliad: 'Gulf Coast',
  Graford: 'DFW',
  'Grand Saline': 'East Texas',
  Grapevine: 'DFW',
  Greenville: 'DFW',
  Groom: 'Panhandle',
  Hearne: 'Central Texas',
  Helotes: 'South Texas',
  Hemphill: 'East Texas',
  Henderson: 'East Texas',
  Hidalgo: 'South Texas',
  Hondo: 'South Texas',
  Houston: 'Gulf Coast',
  Humble: 'Gulf Coast',
  Huntington: 'East Texas',
  Huntsville: 'East Texas',
  Ingram: 'Hill Country',
  Irving: 'DFW',
  Italy: 'Central Texas',
  Jefferson: 'East Texas',
  Junction: 'Hill Country',
  Karnack: 'East Texas',
  Katy: 'Gulf Coast',
  Kemah: 'Gulf Coast',
  Kenova: 'Central Texas',
  Kilgore: 'East Texas',
  Lampasas: 'Central Texas',
  Langtry: 'West Texas',
  Laredo: 'South Texas',
  Leander: 'Central Texas',
  Lindale: 'East Texas',
  Linden: 'East Texas',
  Llano: 'Hill Country',
  Lubbock: 'Panhandle',
  Luling: 'Central Texas',
  Madrid: 'West Texas',
  Mansfield: 'DFW',
  Marathon: 'Big Bend',
  'Marble Falls Township': 'Hill Country',
  Marfa: 'Big Bend',
  McLean: 'Panhandle',
  Midland: 'West Texas',
  'Mineral Wells': 'DFW',
  'Mossel Bay': 'Central Texas',
  Nacogdoches: 'East Texas',
  Nederland: 'Gulf Coast',
  Neece: 'Central Texas',
  'New Braunfels': 'Hill Country',
  Odessa: 'West Texas',
  Orange: 'Gulf Coast',
  Palmer: 'Central Texas',
  Panhandle: 'Panhandle',
  Paradise: 'DFW',
  Paris: 'East Texas',
  Pittsburg: 'East Texas',
  Plano: 'DFW',
  'Port Aransas': 'Gulf Coast',
  'Port Arthur': 'Gulf Coast',
  Quitaque: 'Panhandle',
  'Ransom Canyon': 'Panhandle',
  Redford: 'Big Bend',
  Richardson: 'DFW',
  'Richland Township': 'Central Texas',
  Rockport: 'Gulf Coast',
  Rocksprings: 'West Texas',
  'Round Mountain': 'Hill Country',
  'Round Rock': 'Central Texas',
  'Royse City': 'DFW',
  'Saint Hedwig': 'South Texas',
  'San Angelo': 'West Texas',
  'San Antonio': 'South Texas',
  'San Marcos': 'Central Texas',
  Sanderson: 'West Texas',
  Saratoga: 'East Texas',
  Schulenburg: 'Central Texas',
  Seguin: 'Central Texas',
  Shamrock: 'Panhandle',
  Singapore: 'East Texas',
  Smithville: 'Central Texas',
  Sonora: 'West Texas',
  'Sugar Land': 'Gulf Coast',
  'Sulphur Springs': 'East Texas',
  Sweetwater: 'West Texas',
  Terlingua: 'Big Bend',
  Terrell: 'DFW',
  Texarkana: 'East Texas',
  'Texas City': 'Gulf Coast',
  'The Colony': 'DFW',
  Tilden: 'South Texas',
  Tomball: 'Gulf Coast',
  Turkey: 'Panhandle',
  Tyler: 'East Texas',
  Uvalde: 'South Texas',
  Valentine: 'Big Bend',
  Vega: 'Panhandle',
  Waco: 'Central Texas',
  Warren: 'East Texas',
  Watauga: 'DFW',
  Waxahachie: 'DFW',
  Weatherford: 'DFW',
  West: 'Central Texas',
  Wheeler: 'Panhandle',
  'Wichita Falls': 'Panhandle',
  Wimberley: 'Hill Country',
  'Winkler County': 'West Texas',
  Wortham: 'Central Texas',
  Zavalla: 'East Texas',
}

function inTexasBBox(lat, lng) {
  return lat >= 25.6 && lat <= 36.6 && lng >= -107.0 && lng <= -93.3
}

/**
 * Rough geographic fallback when city is missing, wrong, or not in the map.
 * @param {number} lat
 * @param {number} lng
 */
function regionFromLatLng(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Central Texas'

  if (!inTexasBBox(lat, lng)) {
    return 'Central Texas'
  }

  // South Texas / RGV
  if (lat < 28.4 && lng > -100.5 && lng < -96.5) return 'South Texas'

  // Upper Gulf / Houston–Beaumont–Corpus band
  if (lat < 30.35 && lng >= -98.5 && lng <= -93.5 && !(lat < 28.4 && lng > -98)) return 'Gulf Coast'

  // Big Bend (Trans-Pecos south / west)
  if (lat < 30.85 && lng < -102.9 && lng > -106.2) return 'Big Bend'

  // El Paso / far West
  if (lng < -104.5) return 'West Texas'

  // Permian Basin + west-central
  if (lng < -100.5 && lat < 33.2 && lat > 30.2) return 'West Texas'

  // Panhandle / South Plains
  if (lat >= 33.35 && lng <= -98.8) return 'Panhandle'

  // DFW metro (approximate)
  if (lat >= 32.35 && lat <= 33.55 && lng >= -97.85 && lng <= -96.35) return 'DFW'

  // East Texas (piney woods / Ark-La-Tex)
  if (lng >= -95.2 && lat >= 31.0 && lat <= 33.95) return 'East Texas'

  // Hill Country (rough)
  if (lat >= 29.65 && lat <= 31.05 && lng >= -100.2 && lng <= -98.05) return 'Hill Country'

  // Austin–San Antonio corridor / I-35 central
  if (lat >= 29.2 && lat <= 31.2 && lng >= -98.9 && lng <= -96.8) return 'Central Texas'

  return 'Central Texas'
}

function parseFrontmatter(raw) {
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
  return { data, yamlBlock, body, fullMatch: match[0] }
}

function resolveRegion(data) {
  const city = data.city != null ? String(data.city).trim() : ''
  if (city && CITY_TO_REGION[city]) {
    return CITY_TO_REGION[city]
  }

  const lat = Number(data.lat)
  const lng = Number(data.lng)
  return regionFromLatLng(lat, lng)
}

let updated = 0
const warnings = []

for (const name of readdirSync(PLACES_DIR)) {
  if (!name.endsWith('.md')) continue
  const fp = join(PLACES_DIR, name)
  const raw = readFileSync(fp, 'utf8')
  if (!/^region:\s*Texas\s*$/m.test(raw)) continue

  const parsed = parseFrontmatter(raw)
  if (!parsed) {
    warnings.push(`${name}: could not parse frontmatter`)
    continue
  }

  const next = resolveRegion(parsed.data)
  if (!REGIONS.has(next)) {
    warnings.push(`${name}: resolved invalid region ${next}`)
    continue
  }

  const lat = Number(parsed.data.lat)
  const lng = Number(parsed.data.lng)
  if (!inTexasBBox(lat, lng)) {
    warnings.push(`${name}: coords outside Texas; assigned ${next} (check city/coords)`)
  }

  const newYaml = parsed.yamlBlock.replace(/^region:\s*Texas\s*$/m, `region: ${next}`)
  if (newYaml === parsed.yamlBlock) {
    warnings.push(`${name}: region line not replaced`)
    continue
  }

  const newRaw = `---\n${newYaml}\n---\n${parsed.body}`
  writeFileSync(fp, newRaw, 'utf8')
  updated += 1
}

console.log(`Updated ${updated} place files (region: Texas → specific region).`)
if (warnings.length) {
  console.log('\nWarnings:')
  for (const w of warnings) console.log(`  - ${w}`)
}
