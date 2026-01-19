import WorldMap from '../components/Map/WorldMap'
import './MapPage.css'

export default function MapPage() {
  return (
    <div className="map-wrapper">
      <WorldMap />
      <img
        src="/lodo-logo.png"
        alt="LODO logo"
        className="map-logo"
      />
    </div>
  )
}
