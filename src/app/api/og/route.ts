import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json(null, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VenueViewer/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json(null);

    const html = await res.text();

    function getMeta(property: string): string | null {
      const match =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ??
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return match?.[1] ?? null;
    }

    return NextResponse.json({
      title: getMeta('og:title'),
      description: getMeta('og:description'),
      image: getMeta('og:image'),
    });
  } catch {
    return NextResponse.json(null);
  }
}
