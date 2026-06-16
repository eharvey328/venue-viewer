export async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const key = process.env.GOOGLE_GEOCODING_API_KEY
    if (!key) throw new Error('GOOGLE_GEOCODING_API_KEY is not set')

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
    const res = await fetch(url)
    const data = await res.json() as {
      status: string
      results: Array<{ geometry: { location: { lat: number; lng: number } } }>
    }

    if (data.status !== 'OK' || data.results.length === 0) return null
    const { lat, lng } = data.results[0].geometry.location
    return { lat, lng }
  } catch {
    return null
  }
}
