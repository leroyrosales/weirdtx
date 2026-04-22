import { DEFAULT_DESCRIPTION, SITE_NAME } from './seo'
import type { EventItem, PlaceItem } from './types'

function breadcrumbList(
  origin: string,
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${origin}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
    })),
  }
}

/** Home: Organization + WebSite with publisher link (aligns with Google rich results guidance). */
export function buildHomeJsonLd(origin: string) {
  const base = origin.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: SITE_NAME,
        alternateName: 'Weird Texas',
        url: `${base}/`,
        description: DEFAULT_DESCRIPTION,
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: SITE_NAME,
        alternateName: 'Weird Texas',
        description: DEFAULT_DESCRIPTION,
        url: `${base}/`,
        inLanguage: 'en-US',
        publisher: { '@id': `${base}/#organization` },
      },
    ],
  }
}

/** Index / hub pages: CollectionPage for clearer page purpose to crawlers. */
export function buildCollectionPageJsonLd(opts: {
  origin: string
  name: string
  description: string
  path: string
}) {
  const { origin, name, description, path } = opts
  const base = origin.replace(/\/$/, '')
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${base}/` },
  }
}

export function buildPlaceJsonLd(place: PlaceItem, origin: string) {
  const base = origin.replace(/\/$/, '')
  const desc =
    place.teaser ??
    `${place.title} is a weird Texas spot in ${place.city}, ${place.region}. See map, photos, and details on Weird TX.`

  const addr: Record<string, string> = {
    '@type': 'PostalAddress',
    addressLocality: place.city,
    addressRegion: 'TX',
    addressCountry: 'US',
  }
  if (place.address) addr.streetAddress = place.address

  const main: Record<string, unknown> = {
    '@type': 'TouristAttraction',
    name: place.title,
    description: desc,
    url: `${base}/places/${place.slug}`,
    ...(place.image?.url ? { image: place.image.url } : {}),
    address: addr,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    },
    isPartOf: { '@id': `${base}/#website` },
  }

  const crumbs = breadcrumbList(base, [
    { name: 'Home', path: '/' },
    { name: 'Weird places', path: '/places' },
    { name: place.title, path: `/places/${place.slug}` },
  ])

  return {
    '@context': 'https://schema.org',
    '@graph': [main, crumbs],
  }
}

export function buildEventJsonLd(ev: EventItem, origin: string) {
  const base = origin.replace(/\/$/, '')
  const desc =
    ev.teaser ?? `${ev.title}: Texas event in ${ev.city}, ${ev.region}. Dates and map on Weird TX.`

  const main: Record<string, unknown> = {
    '@type': 'Event',
    name: ev.title,
    description: desc,
    url: `${base}/events/${ev.slug}`,
    ...(ev.image?.url ? { image: ev.image.url } : {}),
    startDate: ev.starts,
    endDate: ev.ends ?? ev.starts,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: `${ev.city}, Texas`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: ev.city,
        addressRegion: 'TX',
        addressCountry: 'US',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: ev.lat,
        longitude: ev.lng,
      },
    },
    isPartOf: { '@id': `${base}/#website` },
  }

  const crumbs = breadcrumbList(base, [
    { name: 'Home', path: '/' },
    { name: 'Weird events', path: '/events' },
    { name: ev.title, path: `/events/${ev.slug}` },
  ])

  return {
    '@context': 'https://schema.org',
    '@graph': [main, crumbs],
  }
}
