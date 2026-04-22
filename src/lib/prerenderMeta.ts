import { getEventBySlug, getPlaceBySlug, regions } from './content'
import { formatEventRange } from './dates'
import { decodeParam, encodeParam, regionFromSlug, regionToSlug } from './routeParams'
import { DEFAULT_DESCRIPTION, truncateMeta } from './seo'
import {
  buildCollectionPageJsonLd,
  buildEventJsonLd,
  buildHomeJsonLd,
  buildPlaceJsonLd,
} from './seoJsonLd'

export type PrerenderHead = {
  /** Title segment before ` · Weird TX` */
  pageTitleShort: string
  description: string
  canonicalUrl: string
  noIndex: boolean
  ogImage?: string
  ogImageAlt?: string
  ogType?: 'website' | 'article'
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
      jsonLd: buildHomeJsonLd(base),
    }
  }

  if (path === '/explore') {
    const desc =
      'Find weird Texas places and events near your location, with optional geolocation, distance sort, and a statewide map on Weird TX.'
    return {
      pageTitleShort: 'Near me',
      description: truncateMeta(desc),
      canonicalUrl,
      noIndex: false,
      jsonLd: buildCollectionPageJsonLd({
        origin: base,
        name: 'Near me: weird Texas by distance',
        description: desc,
        path: '/explore',
      }),
    }
  }

  if (path === '/places') {
    const desc =
      'Browse weird Texas places by region: roadside art, small museums, odd monuments, and map-ready coordinates on Weird TX.'
    return {
      pageTitleShort: 'Weird places',
      description: truncateMeta(desc),
      canonicalUrl,
      noIndex: false,
      jsonLd: buildCollectionPageJsonLd({
        origin: base,
        name: 'Weird Texas places',
        description: desc,
        path: '/places',
      }),
    }
  }

  if (path === '/events') {
    const desc =
      'Texas festivals, fairs, and one-off gatherings worth a detour, with dates, cities, and maps on Weird TX.'
    return {
      pageTitleShort: 'Weird events',
      description: truncateMeta(desc),
      canonicalUrl,
      noIndex: false,
      jsonLd: buildCollectionPageJsonLd({
        origin: base,
        name: 'Weird Texas events',
        description: desc,
        path: '/events',
      }),
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
          `${place.title}: odd Texas place in ${place.city} (${place.region}). Map and details on Weird TX.`,
      ),
      canonicalUrl,
      noIndex: false,
      ogImage: place.image?.url,
      ogImageAlt: place.image?.alt ?? `${place.title} photo`,
      ogType: 'article',
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
          `${ev.title}: Texas event in ${ev.city} (${ev.region}), ${formatEventRange(ev.starts, ev.ends)}. Weird TX.`,
      ),
      canonicalUrl,
      noIndex: false,
      ogImage: ev.image?.url,
      ogImageAlt: ev.image?.alt ?? `${ev.title} photo`,
      ogType: 'article',
      jsonLd: buildEventJsonLd(ev, base),
    }
  }

  if (path.startsWith('/tags/')) {
    const raw = path.slice('/tags/'.length)
    const tagValue = decodeParam(raw).trim()
    if (!tagValue) {
      return notFound(origin, path, 'Tag not found')
    }
    const desc = `Places and events tagged "${tagValue}" on Weird TX: odd Texas listings with an interactive map.`
    return {
      pageTitleShort: `Tag: ${tagValue}`,
      description: truncateMeta(desc),
      canonicalUrl,
      noIndex: false,
      jsonLd: buildCollectionPageJsonLd({
        origin: base,
        name: `Weird Texas tag: ${tagValue}`,
        description: desc,
        path: `/tags/${encodeParam(tagValue)}`,
      }),
    }
  }

  if (path.startsWith('/regions/')) {
    const raw = path.slice('/regions/'.length)
    const regionValue = regionFromSlug(decodeURIComponent(raw), regions)
    if (!regionValue) {
      return notFound(origin, path, 'Region not found')
    }
    const desc = `Weird places and events in ${regionValue}, Texas, with a map and listings on Weird TX.`
    return {
      pageTitleShort: `Region: ${regionValue}`,
      description: truncateMeta(desc),
      canonicalUrl,
      noIndex: false,
      jsonLd: buildCollectionPageJsonLd({
        origin: base,
        name: `Weird Texas: ${regionValue}`,
        description: desc,
        path: `/regions/${regionToSlug(regionValue)}`,
      }),
    }
  }

  if (path === '/random') {
    return {
      pageTitleShort: 'Random listing',
      description: truncateMeta('Jump to a random Weird TX place or event.'),
      canonicalUrl: `${base}/random`,
      noIndex: true,
      jsonLd: null,
    }
  }

  // Sign-in /saved paused: restore block when SavedPlacesPage is wired back in.
  // if (path === '/saved') {
  //   return {
  //     pageTitleShort: 'Saved places',
  //     description: truncateMeta(
  //       'Your Weird TX saved places list. Sign in with Google (Netlify Identity) to sync bookmarks.',
  //     ),
  //     canonicalUrl: `${base}/saved`,
  //     noIndex: true,
  //     jsonLd: null,
  //   }
  // }

  if (path.startsWith('/categories/')) {
    const raw = path.slice('/categories/'.length)
    const categoryValue = decodeParam(raw).trim()
    if (!categoryValue) {
      return notFound(origin, path, 'Category not found')
    }
    const desc = `Weird Texas places and events in the "${categoryValue}" category, with a map and list on Weird TX.`
    return {
      pageTitleShort: `Category: ${categoryValue}`,
      description: truncateMeta(desc),
      canonicalUrl,
      noIndex: false,
      jsonLd: buildCollectionPageJsonLd({
        origin: base,
        name: `Weird Texas category: ${categoryValue}`,
        description: desc,
        path: `/categories/${encodeParam(categoryValue)}`,
      }),
    }
  }

  return notFound(origin, path, 'Not found')
}
