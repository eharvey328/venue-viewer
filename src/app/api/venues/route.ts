import { NextRequest, NextResponse } from 'next/server';
import { parseFilters } from '@/lib/filters';
import { getVenues } from '@/lib/venues';

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);
  const venues = await getVenues(filters);
  return NextResponse.json(venues);
}
