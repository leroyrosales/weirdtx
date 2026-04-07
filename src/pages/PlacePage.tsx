import { Link, useParams } from 'react-router-dom'
import { TexasMap } from '../components/TexasMap'
import { getPlaceBySlug, places } from '../lib/content'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function PlacePage() {
  const { slug } = useParams<{ slug: string }>()
  const place = slug ? getPlaceBySlug(slug) : undefined

  useDocumentTitle(place?.title ?? 'Place not found')

  if (!place) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl text-sky-deep">Place not found</h1>
        <p className="mt-2 text-ink/75">That slug does not match any of our listings.</p>
        <Link
          to="/places"
          className="mt-6 inline-block font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
        >
          ← Back to places
        </Link>
      </div>
    )
  }

  const others = places
    .filter((p) => p.slug !== place.slug && p.region === place.region)
    .slice(0, 3)

  return (
    <article className="space-y-8" aria-labelledby="place-title">
      <Link
        to="/places"
        className="inline-flex min-h-11 items-center text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark sm:min-h-0"
      >
        ← All places
      </Link>
      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-sage-dark">{place.region}</p>
        <h1
          id="place-title"
          className="font-display text-4xl leading-tight tracking-wide text-sky-deep"
        >
          {place.title}
        </h1>
        <p className="mt-1 text-lg text-ink/80">{place.city}</p>
        {place.address ? (
          <p className="mt-1 text-sm text-ink/65">{place.address}</p>
        ) : null}
        {place.tags?.length ? (
          <p className="mt-3 text-sm text-ink/60">{place.tags.join(' · ')}</p>
        ) : null}
        {place.url ? (
          <p className="mt-4">
            <a
              href={place.url}
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
        dangerouslySetInnerHTML={{ __html: place.bodyHtml }}
      />

      <TexasMap
        markers={[
          {
            id: place.slug,
            lat: place.lat,
            lng: place.lng,
            title: place.title,
            kind: 'place',
            subtitle: place.city,
          },
        ]}
        center={[place.lat, place.lng]}
        zoom={10}
        ariaLabel={`Map showing location of ${place.title} in ${place.city}`}
        suppressDetailLinkFor={{ kind: 'place', slug: place.slug }}
      />

      {others.length > 0 ? (
        <section className="border-t border-ink/10 pt-8" aria-labelledby="place-related-heading">
          <h2 id="place-related-heading" className="font-display text-xl tracking-wide text-sky-deep">
            More in {place.region}
          </h2>
          <ul className="mt-3 space-y-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/places/${p.slug}`}
                  className="font-semibold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
                >
                  {p.title}
                </Link>
                <span className="text-ink/65"> — {p.city}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
