export function encodeParam(value: string): string {
  return encodeURIComponent(value)
}

export function decodeParam(value: string | undefined): string {
  return value ? decodeURIComponent(value) : ''
}

/** URL segment for regions: lowercase, spaces → hyphens (no %20). */
export function regionToSlug(region: string): string {
  return region.trim().toLowerCase().replace(/\s+/g, '-')
}

/** Resolve `/regions/hill-country` back to canonical region title. */
export function regionFromSlug(
  slug: string | undefined,
  validRegions: readonly string[],
): string | null {
  if (!slug) return null
  const decoded = decodeURIComponent(slug.trim()).toLowerCase()
  const asHyphen = decoded.replace(/\s+/g, '-')
  for (const r of validRegions) {
    if (regionToSlug(r) === asHyphen) return r
  }
  return null
}

