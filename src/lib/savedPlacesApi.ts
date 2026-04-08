/**
 * Sign-in paused: unused while SavePlaceButton / SavedPlacesPage are not wired in.
 *
 * Persists saved place slugs via Netlify Functions + Blobs.
 * Requires Netlify Identity and `netlify dev` or a deployed site (plain `vite` has no functions).
 */
const PATH = '/.netlify/functions/saved-places'

export class SavedPlacesApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SavedPlacesApiError'
    this.status = status
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function extractSlugs(data: unknown): string[] {
  if (!data || typeof data !== 'object' || !('slugs' in data)) return []
  const raw = (data as { slugs: unknown }).slugs
  return Array.isArray(raw) ? raw.filter((s): s is string => typeof s === 'string') : []
}

export async function fetchSavedSlugs(): Promise<string[]> {
  const res = await fetch(PATH, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText
    throw new SavedPlacesApiError(msg || 'Request failed', res.status)
  }
  return extractSlugs(data)
}

export async function postSavedSlug(action: 'add' | 'remove', slug: string): Promise<string[]> {
  const res = await fetch(PATH, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, slug }),
  })
  const data = await parseJson(res)
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText
    throw new SavedPlacesApiError(msg || 'Request failed', res.status)
  }
  return extractSlugs(data)
}
