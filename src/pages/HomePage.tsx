import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRandomPick } from '../hooks/useRandomPick'
import {
  RANDOM_PICK_BUTTON_ACTIVE_CLASSES,
  RANDOM_PICK_BUTTON_CLASSES,
} from '../lib/randomPickButtonClasses'
import {
  listingCardBodyClasses,
  listingCardEventRowClass,
  listingCardPlaceRowClass,
  listingCardThumbClasses,
  ListingCardThumbMedia,
} from '../components/listingCard'
import { TexasMap } from '../components/TexasMap'
import { events, places } from '../lib/content'
import { DEFAULT_DESCRIPTION, usePageSeo } from '../lib/seo'
import { buildHomeJsonLd } from '../lib/seoJsonLd'

export function HomePage() {
  const { startRandomPick, randomJourneyActive } = useRandomPick()

  const jsonLd = useMemo(() => {
    if (typeof window === 'undefined') return null
    return buildHomeJsonLd(window.location.origin)
  }, [])

  usePageSeo({
    title: 'Home',
    description: DEFAULT_DESCRIPTION,
    jsonLd,
  })
  const featuredPlaces = places.filter((p) => p.featured).slice(0, 3)
  const today = new Date()
  const featuredEvents = (() => {
    const featured = events.filter((e) => e.featured)
    if (featured.length >= 3) return featured.slice(0, 3)

    const featuredSlugs = new Set(featured.map((e) => e.slug))
    const upcoming = [...events]
      .filter((e) => !featuredSlugs.has(e.slug))
      .filter((e) => {
        const endish = new Date(e.ends ?? e.starts)
        return !Number.isNaN(endish.getTime()) && endish.getTime() >= today.getTime()
      })
      .sort((a, b) => new Date(a.starts).getTime() - new Date(b.starts).getTime())

    return [...featured, ...upcoming].slice(0, 3)
  })()

  const mapMarkers = [
    ...places.map((p) => ({
      id: p.slug,
      lat: p.lat,
      lng: p.lng,
      title: p.title,
      kind: 'place' as const,
      subtitle: p.city,
    })),
    ...events.map((e) => ({
      id: e.slug,
      lat: e.lat,
      lng: e.lng,
      title: e.title,
      kind: 'event' as const,
      subtitle: e.city,
    })),
  ]

  return (
    <div className="space-y-14">
      <section
        className="text-center sm:text-left"
        aria-labelledby="home-hero-heading"
      >
        <p className="font-display text-lg tracking-wide text-gold" id="home-tagline">
          Howdy, traveler
        </p>
        <h1
          id="home-hero-heading"
          className="font-display mt-2 text-4xl tracking-wide text-sky-deep sm:text-5xl"
          aria-describedby="home-tagline home-intro"
        >
          The weird, wonderful side of Texas
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/80 sm:mx-0" id="home-intro">
          Oddball landmarks, curious museums, desert mysteries, and festivals that could only happen
          here. Pick a spot on the map or let us find something odd near you.
        </p>
        <div className="mt-8 flex flex-wrap items-stretch justify-center gap-3 sm:justify-start">
          <Link
            to="/explore"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-clay px-5 py-2.5 font-bold text-white shadow-md ring-2 ring-gold-bright/40 hover:bg-clay-dark"
            aria-describedby="home-intro"
          >
            Find weird near me
          </Link>
          <Link
            to="/places"
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-sky-deep/35 bg-white/70 px-5 py-2.5 font-bold text-sage-dark shadow-sm hover:bg-sage/10"
            aria-describedby="home-intro"
          >
            Browse all places
          </Link>
          <button
            type="button"
            aria-label="Open a random place or event listing"
            aria-describedby="home-intro"
            aria-pressed={randomJourneyActive}
            aria-busy={randomJourneyActive}
            onClick={() => startRandomPick()}
            className={`${RANDOM_PICK_BUTTON_CLASSES} max-w-[16rem] px-5 py-3 transition-transform duration-200 ease-out sm:max-w-none sm:gap-3 sm:px-6 sm:py-2.5 ${
              randomJourneyActive ? `${RANDOM_PICK_BUTTON_ACTIVE_CLASSES} scale-[1.02]` : ''
            }`}
          >
            <span className="relative flex flex-col items-center sm:items-start">
              <span className="text-base font-extrabold tracking-wide text-sky-deep sm:text-lg">
                See a random place
              </span>
            </span>
          </button>
        </div>
      </section>

      <section aria-labelledby="home-map-heading">
        <h2 id="home-map-heading" className="font-display text-2xl tracking-wide text-sky-deep">
          Statewide map
        </h2>
        <p className="mt-1 text-ink/75">
          Open a pin for a quick link; every listing has coordinates. Map tiles © OpenStreetMap
          contributors.
        </p>
        <div className="mt-4">
          <TexasMap
            markers={mapMarkers}
            ariaLabel="Map of all Weird TX places and events across Texas"
          />
        </div>
      </section>

      <section
        className="grid gap-10 md:grid-cols-2"
        role="region"
        aria-label="Featured places and events"
      >
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl tracking-wide text-sky-deep" id="featured-places-heading">
              Featured places
            </h2>
            <Link
              to="/places"
              className="min-h-11 text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark sm:min-h-0"
              aria-label="See all places"
            >
              See all
            </Link>
          </div>
          <ul className="mt-4 space-y-3" aria-labelledby="featured-places-heading">
            {featuredPlaces.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/places/${p.slug}`}
                  className={listingCardPlaceRowClass()}
                  aria-label={`${p.title}, ${p.region}, ${p.city}`}
                >
                  <div className={listingCardThumbClasses}>
                    <ListingCardThumbMedia src={p.image?.url} />
                  </div>
                  <div className={listingCardBodyClasses}>
                    <span className="text-xs font-bold uppercase tracking-wide text-sage-dark">
                      {p.region}
                    </span>
                    <p className="font-display text-lg text-sky-deep">{p.title}</p>
                    <p className="text-sm text-ink/70">{p.city}</p>
                    {p.teaser ? <p className="mt-1 text-sm text-ink/80">{p.teaser}</p> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl tracking-wide text-sky-deep" id="featured-events-heading">
              Featured events
            </h2>
            <Link
              to="/events"
              className="min-h-11 text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark sm:min-h-0"
              aria-label="See all events"
            >
              See all
            </Link>
          </div>
          <ul className="mt-4 space-y-3" aria-labelledby="featured-events-heading">
            {featuredEvents.map((e) => (
              <li key={e.slug}>
                <Link
                  to={`/events/${e.slug}`}
                  className={listingCardEventRowClass()}
                  aria-label={`${e.title}, ${e.region}, ${e.city}`}
                >
                  <div className={listingCardThumbClasses}>
                    <ListingCardThumbMedia src={e.image?.url} />
                  </div>
                  <div className={listingCardBodyClasses}>
                    <span className="text-xs font-bold uppercase tracking-wide text-sage-dark">
                      {e.region}
                    </span>
                    <p className="font-display text-lg text-sky-deep">{e.title}</p>
                    <p className="text-sm text-ink/70">{e.city}</p>
                    {e.teaser ? <p className="mt-1 text-sm text-ink/80">{e.teaser}</p> : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
