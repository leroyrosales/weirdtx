import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { events, regions } from '../lib/content'
import { formatEventRange } from '../lib/dates'
import { encodeParam, regionToSlug } from '../lib/routeParams'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function EventsPage() {
  useDocumentTitle('Weird events')
  const [region, setRegion] = useState<string>('')

  const filtered = useMemo(() => {
    if (!region) return events
    return events.filter((e) => e.region === region)
  }, [region])

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => new Date(a.starts).getTime() - new Date(b.starts).getTime()),
    [filtered],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">Weird events</h1>
        <p className="mt-2 max-w-2xl text-ink/80">
          Festivals, gatherings, and only-in-Texas happenings. Dates are a starting point — always
          confirm with organizers before you drive halfway across the state.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="event-region" className="text-sm font-bold text-ink/80">
          Region
        </label>
        <select
          id="event-region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="min-h-11 rounded-lg border border-ink/15 bg-white/85 px-3 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-sky-deep/15"
          aria-describedby="event-region-help"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span id="event-region-help" className="text-sm text-ink/65">
          {sorted.length} listings
        </span>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {sorted.map((e) => (
          <li key={e.slug}>
            <article className="flex h-full min-h-[11rem] flex-col rounded-2xl border border-ink/10 bg-white/50 p-5 shadow-sm transition-all hover:border-mustard/55 hover:shadow-md">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to={`/regions/${regionToSlug(e.region)}`}
                  className="text-xs font-bold uppercase tracking-wide text-sage-dark underline decoration-2 underline-offset-2 hover:text-clay"
                >
                  {e.region}
                </Link>
                {e.category ? (
                  <Link
                    to={`/categories/${encodeParam(e.category)}`}
                    className="text-xs font-bold uppercase tracking-wide text-ink/55 underline decoration-2 underline-offset-2 hover:text-clay"
                  >
                    {e.category}
                  </Link>
                ) : null}
              </div>
              <Link
                to={`/events/${e.slug}`}
                className="font-display mt-1 text-xl text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                aria-label={`${e.title}, ${formatEventRange(e.starts, e.ends)}, ${e.city}, ${e.region}`}
              >
                {e.title}
              </Link>
              <span className="text-sm font-semibold text-clay">{formatEventRange(e.starts, e.ends)}</span>
              <span className="text-sm text-ink/65">{e.city}</span>
              {e.teaser ? <p className="mt-2 flex-1 text-sm text-ink/80">{e.teaser}</p> : null}
              {e.tags?.length ? (
                <p className="mt-3 flex flex-wrap gap-2">
                  {e.tags.slice(0, 6).map((t) => (
                    <Link
                      key={t}
                      to={`/tags/${encodeParam(t)}`}
                      className="rounded-full bg-ink/5 px-2 py-1 text-xs font-semibold text-ink/70 ring-1 ring-ink/10 hover:bg-ink/10"
                    >
                      {t}
                    </Link>
                  ))}
                </p>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
