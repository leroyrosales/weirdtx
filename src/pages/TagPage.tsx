import { Link, useParams } from 'react-router-dom'
import { events, places } from '../lib/content'
import { decodeParam, encodeParam, regionToSlug } from '../lib/routeParams'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function TagPage() {
  const { tag } = useParams<{ tag: string }>()
  const tagValue = decodeParam(tag).trim()

  useDocumentTitle(tagValue ? `Tag: ${tagValue}` : 'Tag not found')

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
              <li key={p.slug} className="rounded-2xl border border-ink/10 bg-white/50 p-4 shadow-sm">
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
              <li key={e.slug} className="rounded-2xl border border-ink/10 bg-white/50 p-4 shadow-sm">
                <Link
                  to={`/events/${e.slug}`}
                  className="font-display text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                >
                  {e.title}
                </Link>
                <p className="text-sm text-ink/70">
                  <Link
                    to={`/regions/${regionToSlug(e.region)}`}
                    className="font-semibold text-sand underline decoration-2 underline-offset-2 hover:text-clay"
                  >
                    {e.region}
                  </Link>{' '}
                  · {e.city}
                </p>
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

