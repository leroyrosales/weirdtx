import { useEffect, useId } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

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

type TexasMapProps = {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  className?: string
  ariaLabel?: string
  /** Hides “View details” for this marker when the user is already on that place/event page. */
  suppressDetailLinkFor?: { kind: 'place' | 'event'; slug: string }
}

const defaultCenter: [number, number] = [31.4, -99.2]
const defaultZoom = 6

export function TexasMap({
  markers,
  center = defaultCenter,
  zoom = defaultZoom,
  className = '',
  ariaLabel = 'Interactive map of Texas places and events. Use zoom and pan controls to explore.',
  suppressDetailLinkFor,
}: TexasMapProps) {
  const mapHelpId = useId()

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
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="z-0 h-[min(420px,55vh)] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} zoom={zoom} />
        {markers.map((m) => {
          const hideDetailLink =
            suppressDetailLinkFor != null &&
            m.kind === suppressDetailLinkFor.kind &&
            m.id === suppressDetailLinkFor.slug

          return (
            <Marker key={m.id} position={[m.lat, m.lng]} title={m.title}>
              <Popup>
                <div className="min-w-[140px] font-body text-ink">
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      m.kind === 'place' ? 'text-sage-dark' : 'text-mustard'
                    }`}
                  >
                    <span className="sr-only">Listing type: </span>
                    {m.kind === 'place' ? 'Place' : 'Event'}
                  </p>
                  <h2 className="font-display text-base font-normal leading-tight text-sky-deep">{m.title}</h2>
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
      </MapContainer>
    </div>
  )
}
