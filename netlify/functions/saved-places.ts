/* Sign-in paused: client no longer calls this endpoint; safe to leave deployed or disable in Netlify. */

import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

const STORE_NAME = 'weirdtx-saved-places'

type Dashboard = { slugs: string[]; updatedAt: string }

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function blobKey(userId: string) {
  return `user-${userId}`
}

function parseBody(body: unknown): { action: 'add' | 'remove'; slug: string } | null {
  if (!body || typeof body !== 'object') return null
  const o = body as { action?: unknown; slug?: unknown }
  const action = o.action
  const slug = o.slug
  if (action !== 'add' && action !== 'remove') return null
  if (typeof slug !== 'string' || slug.length > 160 || !SLUG_RE.test(slug)) return null
  return { action, slug }
}

function normalizeSlugs(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((s): s is string => typeof s === 'string' && SLUG_RE.test(s))
}

export default async (req: Request): Promise<Response> => {
  const user = await getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = getStore({ name: STORE_NAME, consistency: 'strong' })
  const key = blobKey(user.id)

  if (req.method === 'GET') {
    let data: unknown = null
    try {
      data = await store.get(key, { type: 'json' })
    } catch {
      data = null
    }
    const slugs =
      data && typeof data === 'object' && 'slugs' in data
        ? normalizeSlugs((data as Dashboard).slugs)
        : []
    return Response.json({ slugs })
  }

  if (req.method === 'POST') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const parsed = parseBody(body)
    if (!parsed) {
      return Response.json({ error: 'Expected { action: "add" | "remove", slug }' }, { status: 400 })
    }

    let existing: unknown = null
    try {
      existing = await store.get(key, { type: 'json' })
    } catch {
      existing = null
    }
    let slugs =
      existing && typeof existing === 'object' && 'slugs' in existing
        ? normalizeSlugs((existing as Dashboard).slugs)
        : []

    if (parsed.action === 'add') {
      if (!slugs.includes(parsed.slug)) slugs = [...slugs, parsed.slug]
    } else {
      slugs = slugs.filter((s) => s !== parsed.slug)
    }

    const next: Dashboard = { slugs, updatedAt: new Date().toISOString() }
    await store.setJSON(key, next)
    return Response.json({ slugs: next.slugs })
  }

  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } })
}
