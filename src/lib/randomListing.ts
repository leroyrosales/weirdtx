import { events, places } from './content'

/** Returns a client-side random place or event detail path. */
export function pickRandomListingPath(): string {
  const pool: { kind: 'place' | 'event'; slug: string }[] = [
    ...places.map((p) => ({ kind: 'place' as const, slug: p.slug })),
    ...events.map((e) => ({ kind: 'event' as const, slug: e.slug })),
  ]
  if (pool.length === 0) return '/places'
  const pick = pool[Math.floor(Math.random() * pool.length)]!
  return pick.kind === 'place' ? `/places/${pick.slug}` : `/events/${pick.slug}`
}
