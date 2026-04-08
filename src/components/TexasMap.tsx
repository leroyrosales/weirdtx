import { useEffect, useState, type ComponentType } from 'react'
import type { TexasMapClientProps } from './TexasMapClient'

export type { MapMarker } from './TexasMapClient'

type TexasMapProps = TexasMapClientProps

/** SSR/prerender-safe: Leaflet loads only in the browser after mount. */
export function TexasMap(props: TexasMapProps) {
  const [Client, setClient] = useState<ComponentType<TexasMapProps> | null>(null)

  useEffect(() => {
    let cancelled = false
    import('./TexasMapClient').then((m) => {
      if (!cancelled) setClient(() => m.TexasMapClient)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!Client) {
    return (
      <div
        role="region"
        aria-label={props.ariaLabel}
        className={`overflow-hidden rounded-2xl ring-2 ring-sky-deep/25 shadow-md ${props.className ?? ''}`}
      >
        <div className="texas-map flex h-[min(550px,65vh)] w-full items-center justify-center bg-cream text-center text-sm text-ink/60">
          Loading map…
        </div>
      </div>
    )
  }

  return <Client {...props} />
}
