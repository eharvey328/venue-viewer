import { NextRequest, NextResponse } from 'next/server'
import { createVenue } from '@/lib/venues'
import { geocode } from '@/lib/geocode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const name = body.name.trim()
    const address = body.address?.trim() || null
    const sleeps = typeof body.sleeps === 'number' ? body.sleeps : null

    // If client already resolved via Places API, use that data directly
    if (body.googleMapsUrl) {
      const venue = await createVenue({
        name,
        address,
        locality: body.locality ?? null,
        country: body.country ?? null,
        lat: typeof body.lat === 'number' ? body.lat : null,
        lng: typeof body.lng === 'number' ? body.lng : null,
        sleeps,
        googleMapsUrl: body.googleMapsUrl,
        googlePlaceId: body.googlePlaceId ?? null,
      })
      return NextResponse.json(venue, { status: 201 })
    }

    // Manual path: geocode the address
    const coords = address ? await geocode(address) : null
    const venue = await createVenue({
      name,
      address,
      locality: coords?.locality ?? null,
      country: coords?.country ?? null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      sleeps,
      googleMapsUrl: null,
    })

    return NextResponse.json(venue, { status: 201 })
  } catch (e) {
    console.error('POST /api/venues:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
