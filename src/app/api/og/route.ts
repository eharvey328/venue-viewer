import { NextRequest, NextResponse } from 'next/server';

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === '::1'
  );
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json(null, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json(null, { status: 400 });
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json(null, { status: 400 });
  }

  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json(null, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VenueViewer/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json(null);

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let html = '';
    if (reader) {
      while (html.length < 512_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      reader.cancel().catch(() => {});
    }

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
