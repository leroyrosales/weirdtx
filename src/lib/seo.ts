import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const SITE_NAME = 'Weird TX'

export const DEFAULT_DESCRIPTION =
  'Discover oddball Texas landmarks, roadside wonders, small-town museums, and weird festivals, mapped and organized by region. Plan your next Lone Star detour.'

const MAX_DESC = 165

export function truncateMeta(text: string, max = MAX_DESC): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const i = cut.lastIndexOf(' ')
  return (i > 40 ? cut.slice(0, i) : cut).trimEnd() + '…'
}

function metaSelector(attr: 'name' | 'property', key: string): string {
  const safe = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `meta[${attr}="${safe}"][data-weirdtx-seo]`
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const sel = metaSelector(attr, key)
  let el = document.head.querySelector(sel) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute('data-weirdtx-seo', '1')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  const safeRel = rel.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const sel = `link[rel="${safeRel}"][data-weirdtx-seo]`
  let el = document.head.querySelector(sel) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    el.setAttribute('data-weirdtx-seo', '1')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | null) {
  const sel = 'script[type="application/ld+json"][data-weirdtx-seo]'
  let el = document.head.querySelector(sel) as HTMLScriptElement | null
  if (data == null) {
    el?.remove()
    return
  }
  const payload = Array.isArray(data) ? { '@context': 'https://schema.org', '@graph': data } : data
  const json = JSON.stringify(payload)
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.setAttribute('data-weirdtx-seo', '1')
    document.head.appendChild(el)
  }
  el.textContent = json
}

export type PageSeoOptions = {
  title: string
  description?: string
  /** Override canonical path (default: current `location.pathname` + search). */
  canonicalPath?: string
  /** Absolute or site-relative image URL for Open Graph / Twitter. */
  ogImage?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null
  /** Soft 404s and error states — avoid indexing thin duplicate pages. */
  noIndex?: boolean
}

function absoluteUrl(origin: string, urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath
  const path = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`
  return `${origin}${path}`
}

/**
 * Sets document title, meta description, Open Graph / Twitter tags, canonical URL, robots, and optional JSON-LD.
 */
export function usePageSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  jsonLd,
  noIndex,
}: PageSeoOptions) {
  const location = useLocation()

  useEffect(() => {
    const origin = window.location.origin
    const path = canonicalPath ?? `${location.pathname}${location.search}`
    const pageUrl = `${origin}${path.startsWith('/') ? path : `/${path}`}`
    const fullTitle = `${title} · ${SITE_NAME}`
    document.title = fullTitle

    const desc = truncateMeta(description ?? DEFAULT_DESCRIPTION)
    upsertMeta('name', 'description', desc)

    if (noIndex) {
      upsertMeta('name', 'robots', 'noindex, nofollow')
    } else {
      upsertMeta('name', 'robots', 'index, follow')
    }

    upsertLink('canonical', pageUrl)

    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', pageUrl)
    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:locale', 'en_US')

    if (ogImage) {
      const abs = absoluteUrl(origin, ogImage)
      upsertMeta('property', 'og:image', abs)
      upsertMeta('name', 'twitter:card', 'summary_large_image')
      upsertMeta('name', 'twitter:image', abs)
    } else {
      upsertMeta('name', 'twitter:card', 'summary')
      document.head.querySelector('meta[name="twitter:image"][data-weirdtx-seo]')?.remove()
      document.head.querySelector('meta[property="og:image"][data-weirdtx-seo]')?.remove()
    }

    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)

    setJsonLd(jsonLd ?? null)

    return () => {
      setJsonLd(null)
    }
  }, [
    title,
    description,
    canonicalPath,
    location.pathname,
    location.search,
    ogImage,
    jsonLd,
    noIndex,
  ])
}
