import { NextRequest, NextResponse } from 'next/server'
import { createVenue } from '@/lib/venues'
import { geocode } from '@/lib/geocode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const address = body.address?.trim() || null
    const coords = address ? await geocode(address) : null

    const venue = await createVenue({
      name: body.name.trim(),
      address,
      locality: coords?.locality ?? null,
      country: coords?.country ?? null,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      sleeps: typeof body.sleeps === 'number' ? body.sleeps : null,
    })

    return NextResponse.json(venue, { status: 201 })
  } catch (e) {
    console.error('POST /api/venues:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
