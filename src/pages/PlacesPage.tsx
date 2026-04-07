import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { places, regions } from '../lib/content'
import { encodeParam } from '../lib/routeParams'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function PlacesPage() {
  useDocumentTitle('Weird places')
  const [region, setRegion] = useState<string>('')

  const filtered = useMemo(() => {
    if (!region) return places
    return places.filter((p) => p.region === region)
  }, [region])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.title.localeCompare(b.title)),
    [filtered],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">Weird places</h1>
        <p className="mt-2 max-w-2xl text-ink/80">
          Roadside wonders, odd museums, and landscapes that feel a little unreal — organized by
          region so you can plan a loop.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="region-filter" className="text-sm font-bold text-ink/80">
          Region
        </label>
        <select
          id="region-filter"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="min-h-11 rounded-lg border border-ink/15 bg-white/85 px-3 py-2 text-sm font-semibold text-ink shadow-sm ring-1 ring-sky-deep/15"
          aria-describedby="region-filter-help"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span id="region-filter-help" className="text-sm text-ink/65">
          {sorted.length} listings
        </span>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {sorted.map((p) => (
          <li key={p.slug}>
            <article className="flex h-full min-h-[11rem] flex-col rounded-2xl border border-ink/10 bg-white/50 p-5 shadow-sm transition-all hover:border-sage/45 hover:shadow-md">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  to={`/regions/${encodeParam(p.region)}`}
                  className="text-xs font-bold uppercase tracking-wide text-sage-dark underline decoration-2 underline-offset-2 hover:text-clay"
                >
                  {p.region}
                </Link>
                {p.category ? (
                  <Link
                    to={`/categories/${encodeParam(p.category)}`}
                    className="text-xs font-bold uppercase tracking-wide text-ink/55 underline decoration-2 underline-offset-2 hover:text-clay"
                  >
                    {p.category}
                  </Link>
                ) : null}
              </div>
              <Link
                to={`/places/${p.slug}`}
                className="font-display mt-1 text-xl text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                aria-label={`${p.title}, ${p.city}, ${p.region}`}
              >
                {p.title}
              </Link>
              <span className="text-sm text-ink/65">{p.city}</span>
              {p.teaser ? <p className="mt-2 flex-1 text-sm text-ink/80">{p.teaser}</p> : null}
              {p.tags?.length ? (
                <p className="mt-3 flex flex-wrap gap-2">
                  {p.tags.slice(0, 6).map((t) => (
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
