import { NextRequest, NextResponse } from 'next/server';
import { fetchOgMetadata } from '@/lib/og';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json(null, { status: 400 });

  const og = await fetchOgMetadata(url);
  if (og === null) return NextResponse.json(null);
  return NextResponse.json(og);
}
