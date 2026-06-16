import { NextRequest, NextResponse } from 'next/server'
import { getVenueById, updateVenue, deleteVenue } from '@/lib/venues'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const existing = await getVenueById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()

    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    const venue = await updateVenue(id, {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.address !== undefined && { address: body.address?.trim() || null }),
      ...(body.lat !== undefined && { lat: typeof body.lat === 'number' ? body.lat : null }),
      ...(body.lng !== undefined && { lng: typeof body.lng === 'number' ? body.lng : null }),
      ...(body.sleeps !== undefined && { sleeps: typeof body.sleeps === 'number' ? body.sleeps : null }),
    })

    return NextResponse.json(venue)
  } catch (e) {
    console.error('PUT /api/venues/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const existing = await getVenueById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await deleteVenue(id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/venues/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
