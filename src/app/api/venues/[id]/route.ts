import { NextRequest, NextResponse } from 'next/server';
import { getVenueById } from '@/lib/venues';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return NextResponse.json(null, { status: 404 });
  const venue = await getVenueById(id);
  if (!venue) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(venue);
}
