import { Link, useParams } from 'react-router-dom'
import { TexasMap } from '../components/TexasMap'
import { events, getEventBySlug } from '../lib/content'
import { formatEventRange } from '../lib/dates'
import { encodeParam } from '../lib/routeParams'
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
        <p className="text-xs font-bold uppercase tracking-wide text-sage-dark">
          <Link
            to={`/regions/${encodeParam(ev.region)}`}
            className="underline decoration-2 underline-offset-2 hover:text-clay"
          >
            {ev.region}
          </Link>
          {ev.category ? (
            <>
              <span className="text-ink/40"> · </span>
              <Link
                to={`/categories/${encodeParam(ev.category)}`}
                className="underline decoration-2 underline-offset-2 hover:text-clay"
              >
                {ev.category}
              </Link>
            </>
          ) : null}
        </p>
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
          <p className="mt-3 flex flex-wrap gap-2">
            {ev.tags.map((t) => (
              <Link
                key={t}
                to={`/tags/${encodeParam(t)}`}
                className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/70 ring-1 ring-ink/10 hover:bg-ink/10"
              >
                {t}
              </Link>
            ))}
          </p>
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

      {ev.image?.url ? (
        <figure className="overflow-hidden rounded-2xl border border-ink/10 bg-white/40 shadow-sm">
          <img
            src={ev.image.url}
            alt={ev.image.alt ?? `${ev.title} photo`}
            loading="lazy"
            className="h-[min(380px,55vh)] w-full object-cover"
          />
          {ev.image.credit || ev.image.license || ev.image.sourceUrl ? (
            <figcaption className="px-4 py-3 text-xs text-ink/70">
              <span className="font-semibold">Photo</span>
              {ev.image.credit ? <span>{` by ${ev.image.credit}`}</span> : null}
              {ev.image.license ? <span>{` · ${ev.image.license}`}</span> : null}
              {ev.image.sourceUrl ? (
                <>
                  {' '}
                  ·{' '}
                  <a
                    href={ev.image.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
                  >
                    source
                  </a>
                </>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

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
