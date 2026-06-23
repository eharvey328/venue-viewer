import { NextRequest, NextResponse } from 'next/server';
import { getVenues } from '@/lib/venues';
import { parseFiltersFromParams } from '@/lib/filters';

export async function GET(request: NextRequest) {
  const filters = parseFiltersFromParams(request.nextUrl.searchParams);
  const venues = await getVenues(filters);
  return NextResponse.json({ venues });
}
