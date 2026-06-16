import { extractLocality } from './locality'

interface GeocodeResult {
  lat: number
  lng: number
  locality: string | null
  country: string | null
}

interface AddressComponent {
  long_name: string
  types: string[]
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY
    if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not set')

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
    const res = await fetch(url)
    const data = await res.json() as {
      status: string
      results: Array<{
        geometry: { location: { lat: number; lng: number } }
        address_components: AddressComponent[]
      }>
    }

    if (data.status !== 'OK' || data.results.length === 0) return null

    const result = data.results[0]
    const { lat, lng } = result.geometry.location

    function getComponent(type: string) {
      return result.address_components.find((c) => c.types.includes(type))?.long_name ?? null
    }

    const locality = extractLocality(getComponent)
    const country = getComponent('country')

    return { lat, lng, locality, country }
  } catch {
    return null
  }
}
