import { LatLng } from 'leaflet';
import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import * as siteData from "./data/map.json"

import Header from './components/Header.component';
import Footer from './components/Footer.component';

function App() {
  const [position, setPosition] = useState<LatLng | null>(null)

  const LocationMarker = () => {
    const map = useMapEvents({
      click() {
        map.locate()
      },
      locationfound(e) {
        setPosition(e.latlng)
        map.flyTo(e.latlng, map.getZoom())
      },
    })

    return position === null ? null : (
      <Marker position={position}>
        <Popup><p className="text-center pb-0">You are here</p></Popup>
      </Marker>
    )
  }

  return (
    <>
      <Header/>
      <div className="maps_border">
        <div className="container  mx-auto">
          <MapContainer center={[31.4912284, -98.91225]} zoom={6}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors' />
            {siteData.locations.map(park => (
              <Marker
                key={park.location.location_id}
                position={[park.geometry.coordinates[0], park.geometry.coordinates[1]]}
              >
                <Popup
                  position={[park.geometry.coordinates[0], park.geometry.coordinates[1]]}
                >
                  <div>
                    <h2 className="text-lg font-bold">{park.location.NAME}</h2>
                    <p>{park.location.DESCRIPTION}</p>
                    <a target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${park.location.ADDRESS}`}>View on Google Maps</a>
                  </div>
                </Popup>

              </Marker>
            ))}
            <LocationMarker />
          </MapContainer>
        </div>
      </div>
      <Footer/>
    </>
  )
}

export default App
