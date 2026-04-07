import { Link, useParams } from 'react-router-dom'
import { events, places, regions } from '../lib/content'
import { decodeParam, encodeParam } from '../lib/routeParams'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function RegionPage() {
  const { region } = useParams<{ region: string }>()
  const regionValue = decodeParam(region).trim()

  const isValid = regions.includes(regionValue as (typeof regions)[number])
  useDocumentTitle(isValid ? `Region: ${regionValue}` : 'Region not found')

  if (!isValid) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl text-sky-deep">Region not found</h1>
        <p className="mt-2 text-ink/75">Pick a region from places or events pages.</p>
        <Link
          to="/places"
          className="mt-6 inline-block font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
        >
          ← Browse places
        </Link>
      </div>
    )
  }

  const regionPlaces = places.filter((p) => p.region === regionValue).sort((a, b) => a.title.localeCompare(b.title))
  const regionEvents = events
    .filter((e) => e.region === regionValue)
    .sort((a, b) => new Date(a.starts).getTime() - new Date(b.starts).getTime())

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Region</p>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">{regionValue}</h1>
        <p className="mt-2 text-ink/75">
          {regionPlaces.length} places · {regionEvents.length} events.{' '}
          <Link
            to={`/regions/${encodeParam(regionValue)}`}
            className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
          >
            Permalink
          </Link>
        </p>
      </header>

      <section aria-label="Places in this region">
        <h2 className="font-display text-xl tracking-wide text-sky-deep">Places</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {regionPlaces.map((p) => (
            <li key={p.slug} className="rounded-2xl border border-ink/10 bg-white/50 p-4 shadow-sm">
              <Link
                to={`/places/${p.slug}`}
                className="font-display text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
              >
                {p.title}
              </Link>
              <p className="text-sm text-ink/70">{p.city}</p>
              {p.tags?.length ? (
                <p className="mt-2 flex flex-wrap gap-2">
                  {p.tags.slice(0, 6).map((t) => (
                    <Link
                      key={t}
                      to={`/tags/${encodeParam(t)}`}
                      className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/75 ring-1 ring-ink/10 hover:bg-ink/10"
                    >
                      {t}
                    </Link>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Events in this region">
        <h2 className="font-display text-xl tracking-wide text-sky-deep">Events</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {regionEvents.map((e) => (
            <li key={e.slug} className="rounded-2xl border border-ink/10 bg-white/50 p-4 shadow-sm">
              <Link
                to={`/events/${e.slug}`}
                className="font-display text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
              >
                {e.title}
              </Link>
              <p className="text-sm text-ink/70">{e.city}</p>
              {e.tags?.length ? (
                <p className="mt-2 flex flex-wrap gap-2">
                  {e.tags.slice(0, 6).map((t) => (
                    <Link
                      key={t}
                      to={`/tags/${encodeParam(t)}`}
                      className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/75 ring-1 ring-ink/10 hover:bg-ink/10"
                    >
                      {t}
                    </Link>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

