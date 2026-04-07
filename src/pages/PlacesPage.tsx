import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { places, regions } from '../lib/content'
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
            <Link
              to={`/places/${p.slug}`}
              className="flex h-full min-h-[11rem] flex-col rounded-2xl border border-ink/10 bg-white/50 p-5 shadow-sm transition-all hover:border-sage/45 hover:shadow-md"
              aria-label={`${p.title}, ${p.city}, ${p.region}`}
            >
              <span className="text-xs font-bold uppercase tracking-wide text-sage-dark">
                {p.region}
              </span>
              <span className="font-display mt-1 text-xl text-sky-deep">{p.title}</span>
              <span className="text-sm text-ink/65">{p.city}</span>
              {p.teaser ? <p className="mt-2 flex-1 text-sm text-ink/80">{p.teaser}</p> : null}
              {p.tags?.length ? (
                <p className="mt-3 text-xs text-ink/60">{p.tags.join(' · ')}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
