import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TexasMap } from '../components/TexasMap'
import { getPlaceBySlug, places } from '../lib/content'
import { encodeParam, regionToSlug } from '../lib/routeParams'
import { usePageSeo } from '../lib/seo'
import { buildPlaceJsonLd } from '../lib/seoJsonLd'

export function PlacePage() {
  const { slug } = useParams<{ slug: string }>()
  const place = slug ? getPlaceBySlug(slug) : undefined

  const jsonLd = useMemo(() => {
    if (!place) return null
    return buildPlaceJsonLd(place, window.location.origin)
  }, [place])

  usePageSeo({
    title: place?.title ?? 'Place not found',
    description: place
      ? place.teaser ??
        `${place.title} — odd Texas place in ${place.city} (${place.region}). Map and details on Weird TX.`
      : 'This Weird TX place could not be found.',
    ogImage: place?.image?.url,
    jsonLd,
    noIndex: !place,
  })

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
        <p className="text-xs font-bold uppercase tracking-wide text-sage-dark">
          <Link
            to={`/regions/${regionToSlug(place.region)}`}
            className="underline decoration-2 underline-offset-2 hover:text-clay"
          >
            {place.region}
          </Link>
          {place.category ? (
            <>
              <span className="text-ink/40"> · </span>
              <Link
                to={`/categories/${encodeParam(place.category)}`}
                className="underline decoration-2 underline-offset-2 hover:text-clay"
              >
                {place.category}
              </Link>
            </>
          ) : null}
        </p>
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
          <p className="mt-3 flex flex-wrap gap-2">
            {place.tags.map((t) => (
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

      {place.image?.url ? (
        <figure className="overflow-hidden rounded-2xl border border-ink/10 bg-white/40 shadow-sm">
          <img
            src={place.image.url}
            alt={place.image.alt ?? `${place.title} photo`}
            loading="lazy"
            className="h-[min(380px,55vh)] w-full object-cover"
          />
          {place.image.credit || place.image.license || place.image.sourceUrl ? (
            <figcaption className="px-4 py-3 text-xs text-ink/70">
              <span className="font-semibold">Photo</span>
              {place.image.credit ? <span>{` by ${place.image.credit}`}</span> : null}
              {place.image.license ? <span>{` · ${place.image.license}`}</span> : null}
              {place.image.sourceUrl ? (
                <>
                  {' '}
                  ·{' '}
                  <a
                    href={place.image.sourceUrl}
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
