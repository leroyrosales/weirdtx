import { marked } from 'marked'
import { parseMatter } from './matter'
import type { EventFrontmatter, EventItem, PlaceFrontmatter, PlaceItem, Region } from './types'

const REGIONS: Region[] = [
  'Panhandle',
  'West Texas',
  'Hill Country',
  'Central Texas',
  'DFW',
  'East Texas',
  'Gulf Coast',
  'South Texas',
  'Big Bend',
]

function isRegion(s: string): s is Region {
  return REGIONS.includes(s as Region)
}

function slugFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.md$/i, '')
}

function parsePlace(raw: string, path: string): PlaceItem {
  const { data, content } = parseMatter(raw)
  const d = data as Record<string, unknown>
  const region = String(d.region ?? '')
  if (!isRegion(region)) {
    throw new Error(`Invalid region "${region}" in ${path}`)
  }
  const fm: PlaceFrontmatter = {
    title: String(d.title ?? ''),
    city: String(d.city ?? ''),
    region,
    lat: Number(d.lat),
    lng: Number(d.lng),
    tags: Array.isArray(d.tags) ? d.tags.map(String) : undefined,
    featured: Boolean(d.featured),
    teaser: d.teaser != null ? String(d.teaser) : undefined,
    address: d.address != null ? String(d.address) : undefined,
  }
  if (!fm.title || !fm.city || Number.isNaN(fm.lat) || Number.isNaN(fm.lng)) {
    throw new Error(`Missing required fields in place ${path}`)
  }
  return {
    slug: slugFromPath(path),
    ...fm,
    bodyHtml: marked.parse(content.trim(), { async: false }) as string,
  }
}

function parseEvent(raw: string, path: string): EventItem {
  const { data, content } = parseMatter(raw)
  const d = data as Record<string, unknown>
  const region = String(d.region ?? '')
  if (!isRegion(region)) {
    throw new Error(`Invalid region "${region}" in ${path}`)
  }
  const fm: EventFrontmatter = {
    title: String(d.title ?? ''),
    city: String(d.city ?? ''),
    region,
    lat: Number(d.lat),
    lng: Number(d.lng),
    starts: String(d.starts ?? ''),
    ends: d.ends != null ? String(d.ends) : undefined,
    tags: Array.isArray(d.tags) ? d.tags.map(String) : undefined,
    featured: Boolean(d.featured),
    teaser: d.teaser != null ? String(d.teaser) : undefined,
  }
  if (!fm.title || !fm.city || !fm.starts || Number.isNaN(fm.lat) || Number.isNaN(fm.lng)) {
    throw new Error(`Missing required fields in event ${path}`)
  }
  return {
    slug: slugFromPath(path),
    ...fm,
    bodyHtml: marked.parse(content.trim(), { async: false }) as string,
  }
}

const placeModules = import.meta.glob('../content/places/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const eventModules = import.meta.glob('../content/events/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const places: PlaceItem[] = Object.entries(placeModules).map(([path, raw]) =>
  parsePlace(raw, path),
)

export const events: EventItem[] = Object.entries(eventModules).map(([path, raw]) =>
  parseEvent(raw, path),
)

export function getPlaceBySlug(slug: string): PlaceItem | undefined {
  return places.find((p) => p.slug === slug)
}

export function getEventBySlug(slug: string): EventItem | undefined {
  return events.find((e) => e.slug === slug)
}

export const regions = REGIONS
