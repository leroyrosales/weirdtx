import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TexasMap } from '../components/TexasMap'
import { events, places } from '../lib/content'
import { formatEventRange } from '../lib/dates'
import { usePageSeo } from '../lib/seo'
import { sortByDistance } from '../lib/geo'

type Kind = 'all' | 'places' | 'events'
type LocState = { lat: number; lng: number } | null | 'denied' | 'loading'

const RADII = [25, 75, 200] as const

export function ExplorePage() {
  usePageSeo({
    title: 'Near me',
    description:
      'Find weird Texas places and events near your location — optional geolocation, distance sort, and statewide map on Weird TX.',
  })
  const [kind, setKind] = useState<Kind>('all')
  const [radiusMi, setRadiusMi] = useState<(typeof RADII)[number]>(75)
  const [userLoc, setUserLoc] = useState<LocState>(null)

  function requestLocation() {
    if (!navigator.geolocation) {
      setUserLoc('denied')
      return
    }
    setUserLoc('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => setUserLoc('denied'),
      { enableHighAccuracy: true, timeout: 12_000 },
    )
  }

  const placeItems = useMemo(() => {
    const list = kind === 'events' ? [] : places
    if (userLoc && typeof userLoc === 'object') {
      return sortByDistance(list, userLoc).filter(
        (p) => p.distanceMi == null || p.distanceMi <= radiusMi,
      )
    }
    return list
  }, [kind, userLoc, radiusMi])

  const eventItems = useMemo(() => {
    const list = kind === 'places' ? [] : events
    if (userLoc && typeof userLoc === 'object') {
      return sortByDistance(list, userLoc).filter(
        (e) => e.distanceMi == null || e.distanceMi <= radiusMi,
      )
    }
    return list
  }, [kind, userLoc, radiusMi])

  const mapMarkers = useMemo(
    () => [
      ...placeItems.map((p) => ({
        id: p.slug,
        lat: p.lat,
        lng: p.lng,
        title: p.title,
        kind: 'place' as const,
        subtitle:
          userLoc && typeof userLoc === 'object' && 'distanceMi' in p && p.distanceMi != null
            ? `${p.city} · ${p.distanceMi} mi`
            : p.city,
      })),
      ...eventItems.map((e) => ({
        id: e.slug,
        lat: e.lat,
        lng: e.lng,
        title: e.title,
        kind: 'event' as const,
        subtitle:
          userLoc && typeof userLoc === 'object' && 'distanceMi' in e && e.distanceMi != null
            ? `${e.city} · ${e.distanceMi} mi`
            : e.city,
      })),
    ],
    [placeItems, eventItems, userLoc],
  )

  const mapCenter: [number, number] =
    userLoc && typeof userLoc === 'object' ? [userLoc.lat, userLoc.lng] : [31.4, -99.2]

  const mapZoom =
    userLoc && typeof userLoc === 'object'
      ? radiusMi <= 25
        ? 10
        : radiusMi <= 75
          ? 8
          : 7
      : 6

  const statusMessage =
    userLoc === 'denied'
      ? 'Location unavailable — showing all of Texas.'
      : userLoc === 'loading'
        ? 'Requesting your location…'
        : userLoc && typeof userLoc === 'object'
          ? `Sorted by distance from you. Showing listings within ${radiusMi} miles.`
          : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">Near me</h1>
        <p className="mt-2 max-w-2xl text-ink/80">
          Share your location to sort pins by distance and filter by radius. Your coordinates stay in
          your browser — we never send them anywhere.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestLocation}
          disabled={userLoc === 'loading'}
          aria-busy={userLoc === 'loading'}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-clay px-5 py-2 font-bold text-white shadow-md ring-2 ring-gold-bright/35 hover:bg-clay-dark disabled:opacity-60"
        >
          {userLoc === 'loading' ? 'Locating…' : 'Use my location'}
        </button>
        {statusMessage ? (
          <div role="status" aria-live="polite" aria-atomic="true" className="text-sm text-ink/75">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">Listing type to show on the map and in lists</legend>
        <div className="flex flex-wrap gap-2 pb-6">
          {(
            [
              { k: 'all' as const, label: 'Places & events' },
              { k: 'places' as const, label: 'Places' },
              { k: 'events' as const, label: 'Events' },
            ] as const
          ).map(({ k, label }) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 py-2 text-sm font-bold sm:min-h-0 sm:min-w-0 sm:py-1.5 ${
                kind === k
                  ? 'bg-sage text-white ring-2 ring-gold-bright/70'
                  : 'bg-ink/5 text-ink/85 hover:bg-ink/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {userLoc && typeof userLoc === 'object' ? (
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">Maximum distance from your location</legend>
          <div className="flex flex-wrap items-center gap-2 pb-6">
            <span className="text-sm font-semibold text-ink/75">Within</span>
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={radiusMi === r}
                aria-label={`Show listings within ${r} miles of your location`}
                onClick={() => setRadiusMi(r)}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 py-2 text-sm font-bold sm:min-h-0 sm:min-w-0 sm:py-1 ${
                  radiusMi === r
                    ? 'bg-gold-bright text-ink ring-2 ring-sky-deep/40'
                    : 'bg-white/80 ring-1 ring-ink/15 hover:ring-sky-deep/30'
                }`}
              >
                {r} mi
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <TexasMap
        markers={mapMarkers}
        center={mapCenter}
        zoom={mapZoom}
        ariaLabel="Map of Weird TX listings near your location or statewide"
      />

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="explore-places-heading">
          <h2 id="explore-places-heading" className="font-display text-xl tracking-wide text-sky-deep">
            Places
          </h2>
          <ul className="mt-3 space-y-2">
            {placeItems.length === 0 ? (
              <li className="text-sm text-ink/65">No places in this view.</li>
            ) : (
              placeItems.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/places/${p.slug}`}
                    className="flex min-h-11 flex-wrap items-baseline justify-between gap-2 rounded-lg border border-transparent px-2 py-2 hover:border-sage/35 hover:bg-white/60 sm:min-h-0 sm:py-1.5"
                    aria-label={`${p.title}, ${p.city}${'distanceMi' in p && p.distanceMi != null ? `, ${p.distanceMi} miles away` : ''}`}
                  >
                    <span className="font-semibold text-sky-deep">{p.title}</span>
                    <span className="text-sm text-ink/65">
                      {p.city}
                      {'distanceMi' in p && p.distanceMi != null ? ` · ${p.distanceMi} mi` : ''}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
        <section aria-labelledby="explore-events-heading">
          <h2 id="explore-events-heading" className="font-display text-xl tracking-wide text-sky-deep">
            Events
          </h2>
          <ul className="mt-3 space-y-2">
            {eventItems.length === 0 ? (
              <li className="text-sm text-ink/65">No events in this view.</li>
            ) : (
              eventItems.map((e) => (
                <li key={e.slug}>
                  <Link
                    to={`/events/${e.slug}`}
                    className="flex min-h-11 flex-col gap-0.5 rounded-lg border border-transparent px-2 py-2 hover:border-sand/45 hover:bg-white/60 sm:min-h-0 sm:py-1.5"
                    aria-label={`${e.title}, ${formatEventRange(e.starts, e.ends)}${'distanceMi' in e && e.distanceMi != null ? `, ${e.distanceMi} miles away` : ''}`}
                  >
                    <span className="font-semibold text-sky-deep">{e.title}</span>
                    <span className="text-sm text-ink/65">
                      {formatEventRange(e.starts, e.ends)}
                      {'distanceMi' in e && e.distanceMi != null ? ` · ${e.distanceMi} mi` : ''}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
