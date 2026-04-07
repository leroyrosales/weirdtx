import type { GeoPoint } from './types'

const R = 3959

function toRad(d: number): number {
  return (d * Math.PI) / 180
}

export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function sortByDistance<T extends { lat: number; lng: number }>(
  items: T[],
  origin: GeoPoint | null,
): (T & { distanceMi?: number })[] {
  if (!origin) return items.map((i) => ({ ...i }))
  return items
    .map((i) => ({
      ...i,
      distanceMi: Math.round(distanceMiles(origin, i) * 10) / 10,
    }))
    .sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0))
}
