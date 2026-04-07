/**
 * Suggest a free-to-use photo from Wikimedia Commons for a place/event.
 *
 * Strategy:
 * - Find the best matching Wikipedia page title
 * - Use Wikidata (P18) to get an image filename
 * - Resolve that file on Wikimedia Commons for a direct URL + attribution
 *
 * Usage:
 *   node scripts/suggest-wikimedia-photo.mjs "Hamilton Pool Preserve"
 *
 * Output:
 *   JSON with image url + attribution fields you can paste into frontmatter under `image:`.
 */
const title = process.argv.slice(2).join(' ').trim()
if (!title) {
  console.error('Usage: node scripts/suggest-wikimedia-photo.mjs "Place Name"')
  process.exit(1)
}

async function api(base, params) {
  const url = new URL(base)
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url, { headers: { 'user-agent': 'weirdtx (content tool)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

async function wikipediaBestTitle(q) {
  const j = await api('https://en.wikipedia.org/w/api.php', {
    action: 'query',
    list: 'search',
    srsearch: q,
    srlimit: 5,
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
    fileTitle,
    filePageUrl: page?.fullurl ? String(page.fullurl) : undefined,
    imageUrl: ii?.thumburl ? String(ii.thumburl) : ii?.url ? String(ii.url) : undefined,
    artist: meta.Artist?.value ? String(meta.Artist.value).replace(/<[^>]+>/g, '').trim() : undefined,
    license: meta.LicenseShortName?.value ? String(meta.LicenseShortName.value).trim() : undefined,
  }
}

async function main() {
  const wikiTitle = await wikipediaBestTitle(`${title} Texas`)
  if (!wikiTitle) {
    console.log(JSON.stringify({ ok: false, reason: 'No Wikipedia result found.' }, null, 2))
    return
  }

  const { qid, pageUrl } = await wikidataItemForWikipediaTitle(wikiTitle)
  if (!qid) {
    console.log(
      JSON.stringify({ ok: false, reason: 'Wikipedia page has no Wikidata item.', wikiTitle, pageUrl }, null, 2),
    )
    return
  }

  const commonsFile = await commonsFileFromWikidataP18(qid)
  if (!commonsFile) {
    console.log(JSON.stringify({ ok: false, reason: 'No Wikidata P18 image found.', qid, wikiTitle, pageUrl }, null, 2))
    return
  }

  const info = await commonsImageInfo(commonsFile)
  if (!info.imageUrl) {
    console.log(JSON.stringify({ ok: false, reason: 'Could not resolve image URL on Commons.', commonsFile }, null, 2))
    return
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        wikiTitle,
        wikiUrl: pageUrl,
        image: {
          url: info.imageUrl,
          alt: title,
          credit: info.artist,
          sourceUrl: info.filePageUrl,
          license: info.license,
        },
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

