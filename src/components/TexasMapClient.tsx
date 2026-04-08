import { useEffect, useId, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import MarkerClusterGroup from 'react-leaflet-cluster'

function pinHtml(kind: 'place' | 'event'): string {
  return `<div class="texas-map-pin texas-map-pin--${kind}" role="presentation"><span class="texas-map-pin-dot"></span></div>`
}

function divIconForKind(kind: 'place' | 'event'): L.DivIcon {
  return L.divIcon({
    className: 'texas-map-divicon',
    html: pinHtml(kind),
    iconSize: [30, 38],
    iconAnchor: [15, 34],
    popupAnchor: [0, -30],
  })
}

export type MapMarker = {
  id: string
  lat: number
  lng: number
  title: string
  kind: 'place' | 'event'
  subtitle?: string
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

function googleMapsSearchUrl(lat: number, lng: number): string {
  const q = encodeURIComponent(`${lat},${lng}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function MapLocationButton({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const url = googleMapsSearchUrl(lat, lng)

  return (
    <div className="mt-3 border-t border-ink/15 pt-2">
      <button
        type="button"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        className="min-h-11 w-full rounded-md border-2 border-sky-deep/40 bg-sky-deep/10 px-2 py-2.5 text-center text-xs font-bold text-sky-deep hover:bg-sky-deep/20"
        aria-label={`Map ${title} in Google Maps (opens in a new window)`}
      >
        Map location
      </button>
    </div>
  )
}

export type TexasMapClientProps = {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  fitBoundsToMarkers?: boolean
  maxFitZoom?: number
  className?: string
  ariaLabel?: string
  suppressDetailLinkFor?: { kind: 'place' | 'event'; slug: string }
}

const defaultCenter: [number, number] = [31.4, -99.2]
const defaultZoom = 6

function FitBoundsToMarkers({
  markers,
  maxZoom = 10,
}: {
  markers: MapMarker[]
  maxZoom?: number
}) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [22, 22], maxZoom })
  }, [map, markers, maxZoom])
  return null
}

export function TexasMapClient({
  markers,
  center = defaultCenter,
  zoom = defaultZoom,
  fitBoundsToMarkers = false,
  maxFitZoom = 12,
  className = '',
  ariaLabel = 'Interactive map of Texas places and events. Use zoom and pan controls to explore.',
  suppressDetailLinkFor,
}: TexasMapClientProps) {
  const mapHelpId = useId()
  const placeIcon = useMemo(() => divIconForKind('place'), [])
  const eventIcon = useMemo(() => divIconForKind('event'), [])

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      aria-describedby={mapHelpId}
      className={`overflow-hidden rounded-2xl ring-2 ring-sky-deep/25 shadow-md ${className}`}
    >
      <p id={mapHelpId} className="sr-only">
        Interactive map. Tab into the map to use keyboard: arrow keys to pan, plus and minus keys to
        zoom. Markers can be activated to open a panel with details and an external Google Maps link.
      </p>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="texas-map z-0 h-[min(550px,65vh)] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          maxNativeZoom={20}
        />
        {fitBoundsToMarkers ? <FitBoundsToMarkers markers={markers} maxZoom={maxFitZoom} /> : null}
        <Recenter center={center} zoom={zoom} />
        <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
          {markers.map((m) => {
            const hideDetailLink =
              suppressDetailLinkFor != null &&
              m.kind === suppressDetailLinkFor.kind &&
              m.id === suppressDetailLinkFor.slug

            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                title={m.title}
                icon={m.kind === 'place' ? placeIcon : eventIcon}
              >
                <Popup>
                  <div className="min-w-[140px] font-body text-ink">
                    <p
                      className={`text-xs font-bold uppercase tracking-wide ${
                        m.kind === 'place' ? 'text-sage-dark' : 'text-gold'
                      }`}
                    >
                      <span className="sr-only">Listing type: </span>
                      {m.kind === 'place' ? 'Place' : 'Event'}
                    </p>
                    <h2 className="font-display text-base font-normal leading-tight text-sky-deep">
                      {m.title}
                    </h2>
                    {m.subtitle ? <p className="text-xs text-ink/70">{m.subtitle}</p> : null}
                    {!hideDetailLink ? (
                      <Link
                        to={m.kind === 'place' ? `/places/${m.id}` : `/events/${m.id}`}
                        className="mt-2 inline-flex min-h-11 items-center text-sm font-bold text-clay underline decoration-2 underline-offset-2 hover:text-clay-dark"
                      >
                        View details<span className="sr-only">: {m.title}</span>
                      </Link>
                    ) : null}
                    <MapLocationButton lat={m.lat} lng={m.lng} title={m.title} />
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  )
}
