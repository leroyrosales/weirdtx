import { Link, useParams } from 'react-router-dom'
import { events, places } from '../lib/content'
import { decodeParam, regionToSlug } from '../lib/routeParams'
import { usePageSeo } from '../lib/seo'

export function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const categoryValue = decodeParam(category).trim()

  usePageSeo({
    title: categoryValue ? `Category: ${categoryValue}` : 'Category not found',
    description: categoryValue
      ? `Weird Texas places and events in the "${categoryValue}" category — map and list on Weird TX.`
      : 'This category could not be found on Weird TX.',
    noIndex: !categoryValue,
  })

  if (!categoryValue) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl text-sky-deep">Category not found</h1>
        <p className="mt-2 text-ink/75">That category looks empty.</p>
        <Link
          to="/places"
          className="mt-6 inline-block font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
        >
          ← Browse places
        </Link>
      </div>
    )
  }

  const catPlaces = places.filter((p) => p.category === categoryValue).sort((a, b) => a.title.localeCompare(b.title))
  const catEvents = events.filter((e) => e.category === categoryValue)

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-ink/60">Category</p>
        <h1 className="font-display text-3xl tracking-wide text-sky-deep">{categoryValue}</h1>
        <p className="mt-2 text-ink/75">
          {catPlaces.length} places · {catEvents.length} events.
        </p>
      </header>

      <section aria-label="Places in this category">
        <h2 className="font-display text-xl tracking-wide text-sky-deep">Places</h2>
        {catPlaces.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {catPlaces.map((p) => (
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
          <p className="mt-2 text-sm text-ink/65">No places found for this category.</p>
        )}
      </section>

      <section aria-label="Events in this category">
        <h2 className="font-display text-xl tracking-wide text-sky-deep">Events</h2>
        {catEvents.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {catEvents.map((e) => (
              <li key={e.slug} className="rounded-2xl border border-ink/10 bg-white/50 p-4 shadow-sm">
                <Link
                  to={`/events/${e.slug}`}
                  className="font-display text-lg text-sky-deep underline decoration-2 underline-offset-2 hover:text-clay"
                >
                  {e.title}
                </Link>
                <p className="text-sm text-ink/70">{e.city}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink/65">No events found for this category.</p>
        )}
      </section>
    </div>
  )
}

