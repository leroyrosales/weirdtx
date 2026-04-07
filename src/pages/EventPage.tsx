import { Link, useParams } from 'react-router-dom'
import { TexasMap } from '../components/TexasMap'
import { events, getEventBySlug } from '../lib/content'
import { formatEventRange } from '../lib/dates'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function EventPage() {
  const { slug } = useParams<{ slug: string }>()
  const ev = slug ? getEventBySlug(slug) : undefined

  useDocumentTitle(ev?.title ?? 'Event not found')

  if (!ev) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl text-sky-deep">Event not found</h1>
        <p className="mt-2 text-ink/75">That slug does not match any of our listings.</p>
        <Link
          to="/events"
          className="mt-6 inline-block font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
        >
          ← Back to events
        </Link>
      </div>
    )
  }

  const others = events
    .filter((e) => e.slug !== ev.slug && e.region === ev.region)
    .slice(0, 3)

  return (
    <article className="space-y-8" aria-labelledby="event-title">
      <Link
        to="/events"
        className="inline-flex min-h-11 items-center text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark sm:min-h-0"
      >
        ← All events
      </Link>
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-mustard">{ev.region}</p>
        <h1
          id="event-title"
          className="font-display text-4xl leading-tight tracking-wide text-sky-deep"
        >
          {ev.title}
        </h1>
        <p className="mt-2 text-lg font-semibold text-clay">
          {formatEventRange(ev.starts, ev.ends)}
        </p>
        <p className="text-lg text-ink/80">{ev.city}</p>
        {ev.tags?.length ? (
          <p className="mt-3 text-sm text-ink/60">{ev.tags.join(' · ')}</p>
        ) : null}
        {ev.url ? (
          <p className="mt-4">
            <a
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark sm:min-h-0"
            >
              Official website →
            </a>
          </p>
        ) : null}
      </header>

      <div
        className="prose-weird max-w-none text-ink/90"
        dangerouslySetInnerHTML={{ __html: ev.bodyHtml }}
      />

      <TexasMap
        markers={[
          {
            id: ev.slug,
            lat: ev.lat,
            lng: ev.lng,
            title: ev.title,
            kind: 'event',
            subtitle: ev.city,
          },
        ]}
        center={[ev.lat, ev.lng]}
        zoom={9}
        ariaLabel={`Map showing location of ${ev.title} in ${ev.city}`}
        suppressDetailLinkFor={{ kind: 'event', slug: ev.slug }}
      />

      {others.length > 0 ? (
        <section className="border-t border-ink/10 pt-8" aria-labelledby="event-related-heading">
          <h2 id="event-related-heading" className="font-display text-xl tracking-wide text-sky-deep">
            More in {ev.region}
          </h2>
          <ul className="mt-3 space-y-2">
            {others.map((e) => (
              <li key={e.slug}>
                <Link
                  to={`/events/${e.slug}`}
                  className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
                >
                  {e.title}
                </Link>
                <span className="text-ink/65">
                  {' '}
                  — {formatEventRange(e.starts, e.ends)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
