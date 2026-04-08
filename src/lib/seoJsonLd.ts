import type { EventItem, PlaceItem } from './types'

export function buildPlaceJsonLd(place: PlaceItem, origin: string) {
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

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: place.title,
    description: desc,
    url: `${origin}/places/${place.slug}`,
    ...(place.image?.url ? { image: place.image.url } : {}),
    address: addr,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: place.lat,
      longitude: place.lng,
    },
  }
}

export function buildEventJsonLd(ev: EventItem, origin: string) {
  const desc =
    ev.teaser ??
    `${ev.title} — Texas event in ${ev.city}, ${ev.region}. Dates and map on Weird TX.`

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: desc,
    url: `${origin}/events/${ev.slug}`,
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
  }
}
