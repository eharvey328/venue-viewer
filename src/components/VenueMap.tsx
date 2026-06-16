'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

function useLeafletIconFix() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])
}

interface VenueMapVenue {
  id: number
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  sleeps: number | null
}

export default function VenueMap({ venues }: { venues: VenueMapVenue[] }) {
  useLeafletIconFix()

  const mapped = venues.filter((v): v is VenueMapVenue & { lat: number; lng: number } =>
    v.lat !== null && v.lng !== null
  )
  const unmappedCount = venues.length - mapped.length

  const center: [number, number] =
    mapped.length > 0
      ? [
          mapped.reduce((sum, v) => sum + v.lat, 0) / mapped.length,
          mapped.reduce((sum, v) => sum + v.lng, 0) / mapped.length,
        ]
      : [46.5, 2.5]

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={5}
        className="h-[calc(100dvh-160px)] w-full rounded-xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapped.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-gray-900">{v.name}</p>
                {v.address && <p className="text-xs text-gray-500 mt-0.5">{v.address}</p>}
                {v.sleeps != null && (
                  <p className="text-xs text-blue-700 mt-1">Sleeps {v.sleeps}</p>
                )}
                <Link
                  href={`/venues/${v.id}`}
                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {unmappedCount > 0 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          {unmappedCount} venue{unmappedCount !== 1 ? 's' : ''} not shown (no coordinates)
        </p>
      )}
    </div>
  )
}
