import { Link, useParams } from 'react-router-dom'
import {
  ListingCardImageLink,
  listingCardBodyClasses,
  listingCardEventRowClass,
  listingCardPlaceRowClass,
} from '../components/listingCard'
import { events, places } from '../lib/content'
import { decodeParam, encodeParam, regionToSlug } from '../lib/routeParams'
import { usePageSeo } from '../lib/seo'

export function TagPage() {
  const { tag } = useParams<{ tag: string }>()
  const tagValue = decodeParam(tag).trim()

  usePageSeo({
    title: tagValue ? `Tag: ${tagValue}` : 'Tag not found',
    description: tagValue
      ? `Places and events tagged "${tagValue}" on Weird TX: odd Texas listings with an interactive map.`
      : 'This tag could not be found on Weird TX.',
    noIndex: !tagValue,
  })

  if (!tagValue) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl text-sky-deep">Tag not found</h1>
        <p className="mt-2 text-ink/75">That tag looks empty.</p>
        <Link
          to="/"
          className="mt-6 inline-block font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
        >
          ← Back home
        </Link>
      </div>
    )
  }

  const taggedPlaces = places.filter((p) => p.tags?.includes(tagValue))
  const taggedEvents = events.filter((e) => e.tags?.includes(tagValue))

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Tag</p>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">{tagValue}</h1>
        <p className="mt-2 text-ink/75">
          {taggedPlaces.length + taggedEvents.length} listings.{' '}
          <Link
            to={`/tags/${encodeParam(tagValue)}`}
            className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
          >
            Permalink
          </Link>
        </p>
      </header>

      <section aria-label="Places with this tag">
        <h2 className="font-display text-xl tracking-wide text-sky-deep">Places</h2>
        {taggedPlaces.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {taggedPlaces.map((p) => (
              <li key={p.slug}>
                <article className={listingCardPlaceRowClass()}>
                  <ListingCardImageLink
                    to={`/places/${p.slug}`}
                    src={p.image?.url}
                    ariaLabel={`${p.title}, ${p.city}, view place`}
                  />
                  <div className={listingCardBodyClasses}>
                    <Link
                      to={`/places/${p.slug}`}
                      className="font-display text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                    >
                      {p.title}
                    </Link>
                    <p className="text-sm text-ink/70">
                      <Link
                        to={`/regions/${regionToSlug(p.region)}`}
                        className="font-semibold text-sage-dark underline decoration-2 underline-offset-2 hover:text-clay"
                      >
                        {p.region}
                      </Link>{' '}
                      · {p.city}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink/65">No places found for this tag.</p>
        )}
      </section>

      <section aria-label="Events with this tag">
        <h2 className="font-display text-xl tracking-wide text-sky-deep">Events</h2>
        {taggedEvents.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {taggedEvents.map((e) => (
              <li key={e.slug}>
                <article className={listingCardEventRowClass()}>
                  <ListingCardImageLink
                    to={`/events/${e.slug}`}
                    src={e.image?.url}
                    ariaLabel={`${e.title}, view event`}
                  />
                  <div className={listingCardBodyClasses}>
                    <Link
                      to={`/events/${e.slug}`}
                      className="font-display text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                    >
                      {e.title}
                    </Link>
                    <p className="text-sm text-ink/70">
                      <Link
                        to={`/regions/${regionToSlug(e.region)}`}
                        className="font-semibold text-sage-dark underline decoration-2 underline-offset-2 hover:text-clay"
                      >
                        {e.region}
                      </Link>{' '}
                      · {e.city}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink/65">No events found for this tag.</p>
        )}
      </section>
    </div>
  )
}

