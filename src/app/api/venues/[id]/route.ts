import { NextRequest, NextResponse } from 'next/server';
import { getVenueById, updateVenue, deleteVenue } from '@/lib/venues';
import { geocode } from '@/lib/geocode';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await getVenueById(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();

    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }

    const update: Parameters<typeof updateVenue>[1] = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.sleeps !== undefined)
      update.sleeps = typeof body.sleeps === 'number' ? body.sleeps : null;

    if (body.address !== undefined) {
      const address = body.address?.trim() || null;
      update.address = address;

      // If client resolved via Places API, use provided data directly
      if (body.googleMapsUrl !== undefined) {
        update.locality = body.locality ?? null;
        update.country = body.country ?? null;
        update.lat = typeof body.lat === 'number' ? body.lat : null;
        update.lng = typeof body.lng === 'number' ? body.lng : null;
        update.googleMapsUrl = body.googleMapsUrl ?? null;
        update.googlePlaceId = body.googlePlaceId ?? null;
      } else {
        // Manual path: geocode
        const coords = address ? await geocode(address) : null;
        update.locality = coords?.locality ?? null;
        update.country = coords?.country ?? null;
        update.lat = coords?.lat ?? null;
        update.lng = coords?.lng ?? null;
        update.googleMapsUrl = null;
      }
    }

    const venue = await updateVenue(id, update);
    return NextResponse.json(venue);
  } catch (e) {
    console.error('PUT /api/venues/[id]:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const existing = await getVenueById(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await deleteVenue(id);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('DELETE /api/venues/[id]:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
