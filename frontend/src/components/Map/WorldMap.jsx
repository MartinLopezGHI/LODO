import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

export default function WorldMap() {
  const startups = [
    {
      id: 1,
      name: 'Demo Agtech',
      country: 'Argentina',
      city: 'Buenos Aires',
      lat: -34.6037,
      lng: -58.3816
    }
  ]

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}   // 👈 clave
      maxZoom={18}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      {startups.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup>
            <strong>{s.name}</strong><br />
            {s.city}, {s.country}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
