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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function linkifyBareUrls(markdown: string): string {
  // Convert bare URLs into autolink form (<https://...>) so `marked` renders them as links.
  // Keep it conservative: avoid touching code blocks/inline code and existing autolinks.
  const parts = markdown.split(/(```[\s\S]*?```|`[^`]*`)/g)
  return parts
    .map((part) => {
      if (part.startsWith('```') || part.startsWith('`')) return part
      return part.replace(/(^|[\s(])((https?:\/\/)[^\s<>()]+)(?=$|[\s).,!?:;])/g, (m, pre, url) => {
        if (url.startsWith('<') && url.endsWith('>')) return m
        return `${pre}<${url}>`
      })
    })
    .join('')
}

marked.use({
  renderer: {
    link({ href, title, text }) {
      const safeHref = href ?? ''
      const safeTitleAttr = title ? ` title="${escapeHtml(title)}"` : ''
      const isExternal = /^https?:\/\//i.test(safeHref)
      const externalAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(safeHref)}"${safeTitleAttr}${externalAttrs}>${text}</a>`
    },
  },
})

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
    url: d.url != null ? String(d.url) : undefined,
    image:
      d.image && typeof d.image === 'object' && !Array.isArray(d.image)
        ? {
            url: String((d.image as Record<string, unknown>).url ?? ''),
            alt:
              (d.image as Record<string, unknown>).alt != null
                ? String((d.image as Record<string, unknown>).alt)
                : undefined,
            credit:
              (d.image as Record<string, unknown>).credit != null
                ? String((d.image as Record<string, unknown>).credit)
                : undefined,
            sourceUrl:
              (d.image as Record<string, unknown>).sourceUrl != null
                ? String((d.image as Record<string, unknown>).sourceUrl)
                : undefined,
            license:
              (d.image as Record<string, unknown>).license != null
                ? String((d.image as Record<string, unknown>).license)
                : undefined,
          }
        : undefined,
  }
  if (!fm.title || !fm.city || Number.isNaN(fm.lat) || Number.isNaN(fm.lng)) {
    throw new Error(`Missing required fields in place ${path}`)
  }
  if (fm.image && !fm.image.url) {
    fm.image = undefined
  }
  return {
    slug: slugFromPath(path),
    ...fm,
    bodyHtml: marked.parse(linkifyBareUrls(content.trim()), { async: false }) as string,
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
    url: d.url != null ? String(d.url) : undefined,
    image:
      d.image && typeof d.image === 'object' && !Array.isArray(d.image)
        ? {
            url: String((d.image as Record<string, unknown>).url ?? ''),
            alt:
              (d.image as Record<string, unknown>).alt != null
                ? String((d.image as Record<string, unknown>).alt)
                : undefined,
            credit:
              (d.image as Record<string, unknown>).credit != null
                ? String((d.image as Record<string, unknown>).credit)
                : undefined,
            sourceUrl:
              (d.image as Record<string, unknown>).sourceUrl != null
                ? String((d.image as Record<string, unknown>).sourceUrl)
                : undefined,
            license:
              (d.image as Record<string, unknown>).license != null
                ? String((d.image as Record<string, unknown>).license)
                : undefined,
          }
        : undefined,
  }
  if (!fm.title || !fm.city || !fm.starts || Number.isNaN(fm.lat) || Number.isNaN(fm.lng)) {
    throw new Error(`Missing required fields in event ${path}`)
  }
  if (fm.image && !fm.image.url) {
    fm.image = undefined
  }
  return {
    slug: slugFromPath(path),
    ...fm,
    bodyHtml: marked.parse(linkifyBareUrls(content.trim()), { async: false }) as string,
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
