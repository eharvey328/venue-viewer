import { NextRequest, NextResponse } from 'next/server'
import { createVenue } from '@/lib/venues'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const venue = await createVenue({
      name: body.name.trim(),
      address: body.address?.trim() || null,
      lat: typeof body.lat === 'number' ? body.lat : null,
      lng: typeof body.lng === 'number' ? body.lng : null,
      sleeps: typeof body.sleeps === 'number' ? body.sleeps : null,
    })

    return NextResponse.json(venue, { status: 201 })
  } catch (e) {
    console.error('POST /api/venues:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
