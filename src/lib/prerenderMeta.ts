import { getEventBySlug, getPlaceBySlug, regions } from './content'
import { formatEventRange } from './dates'
import { decodeParam, regionFromSlug } from './routeParams'
import { DEFAULT_DESCRIPTION, SITE_NAME, truncateMeta } from './seo'
import { buildEventJsonLd, buildPlaceJsonLd } from './seoJsonLd'

export type PrerenderHead = {
  /** Title segment before ` · ${SITE_NAME}` */
  pageTitleShort: string
  description: string
  canonicalUrl: string
  noIndex: boolean
  ogImage?: string
  jsonLd: Record<string, unknown> | Record<string, unknown>[] | null
}

function normPath(pathname: string): string {
  const p = pathname.split('?')[0].replace(/\/$/, '') || '/'
  return p
}

function absOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

function notFound(origin: string, path: string, label: string): PrerenderHead {
  const canonicalUrl = `${absOrigin(origin)}${path}`
  return {
    pageTitleShort: label,
    description: truncateMeta(`This Weird TX page could not be found.`),
    canonicalUrl,
    noIndex: true,
    jsonLd: null,
  }
}

export function buildHeadTags(pathname: string, origin: string): PrerenderHead {
  const path = normPath(pathname)
  const base = absOrigin(origin)
  const canonicalUrl = `${base}${path}`

  if (path === '/') {
    return {
      pageTitleShort: 'Home',
      description: truncateMeta(DEFAULT_DESCRIPTION),
      canonicalUrl: `${base}/`,
      noIndex: false,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: 'Weird Texas',
        description: DEFAULT_DESCRIPTION,
        url: `${base}/`,
        inLanguage: 'en-US',
      },
    }
  }

  if (path === '/explore') {
    return {
      pageTitleShort: 'Near me',
      description: truncateMeta(
        'Find weird Texas places and events near your location — optional geolocation, distance sort, and statewide map on Weird TX.',
      ),
      canonicalUrl,
      noIndex: false,
      jsonLd: null,
    }
  }

  if (path === '/places') {
    return {
      pageTitleShort: 'Weird places',
      description: truncateMeta(
        'Browse weird Texas places by region — roadside art, small museums, odd monuments, and map-ready coordinates on Weird TX.',
      ),
      canonicalUrl,
      noIndex: false,
      jsonLd: null,
    }
  }

  if (path === '/events') {
    return {
      pageTitleShort: 'Weird events',
      description: truncateMeta(
        'Texas festivals, fairs, and one-off gatherings worth a detour — dates, cities, and maps on Weird TX.',
      ),
      canonicalUrl,
      noIndex: false,
      jsonLd: null,
    }
  }

  if (path.startsWith('/places/')) {
    const slug = decodeURIComponent(path.slice('/places/'.length))
    const place = getPlaceBySlug(slug)
    if (!place) {
      return notFound(origin, path, 'Place not found')
    }
    return {
      pageTitleShort: place.title,
      description: truncateMeta(
        place.teaser ??
          `${place.title} — odd Texas place in ${place.city} (${place.region}). Map and details on Weird TX.`,
      ),
      canonicalUrl,
      noIndex: false,
      ogImage: place.image?.url,
      jsonLd: buildPlaceJsonLd(place, base),
    }
  }

  if (path.startsWith('/events/')) {
    const slug = decodeURIComponent(path.slice('/events/'.length))
    const ev = getEventBySlug(slug)
    if (!ev) {
      return notFound(origin, path, 'Event not found')
    }
    return {
      pageTitleShort: ev.title,
      description: truncateMeta(
        ev.teaser ??
          `${ev.title} — Texas event in ${ev.city} (${ev.region}), ${formatEventRange(ev.starts, ev.ends)}. Weird TX.`,
      ),
      canonicalUrl,
      noIndex: false,
      ogImage: ev.image?.url,
      jsonLd: buildEventJsonLd(ev, base),
    }
  }

  if (path.startsWith('/tags/')) {
    const raw = path.slice('/tags/'.length)
    const tagValue = decodeParam(raw).trim()
    if (!tagValue) {
      return notFound(origin, path, 'Tag not found')
    }
    return {
      pageTitleShort: `Tag: ${tagValue}`,
      description: truncateMeta(
        `Places and events tagged "${tagValue}" on Weird TX — odd Texas listings with an interactive map.`,
      ),
      canonicalUrl,
      noIndex: false,
      jsonLd: null,
    }
  }

  if (path.startsWith('/regions/')) {
    const raw = path.slice('/regions/'.length)
    const regionValue = regionFromSlug(decodeURIComponent(raw), regions)
    if (!regionValue) {
      return notFound(origin, path, 'Region not found')
    }
    return {
      pageTitleShort: `Region: ${regionValue}`,
      description: truncateMeta(
        `Weird places and events in ${regionValue}, Texas — map and listings on Weird TX.`,
      ),
      canonicalUrl,
      noIndex: false,
      jsonLd: null,
    }
  }

  if (path.startsWith('/categories/')) {
    const raw = path.slice('/categories/'.length)
    const categoryValue = decodeParam(raw).trim()
    if (!categoryValue) {
      return notFound(origin, path, 'Category not found')
    }
    return {
      pageTitleShort: `Category: ${categoryValue}`,
      description: truncateMeta(
        `Weird Texas places and events in the "${categoryValue}" category — map and list on Weird TX.`,
      ),
      canonicalUrl,
      noIndex: false,
      jsonLd: null,
    }
  }

  return notFound(origin, path, 'Not found')
}
