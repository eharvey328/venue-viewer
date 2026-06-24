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

export interface OgMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
}

export async function fetchOgMetadata(url: string): Promise<OgMetadata | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  if (isPrivateHost(parsed.hostname)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VenueViewer/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

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
        html.match(
          new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
        ) ??
        html.match(
          new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i')
        );
      return match?.[1] ?? null;
    }

    return {
      title: getMeta('og:title'),
      description: getMeta('og:description'),
      image: getMeta('og:image'),
    };
  } catch {
    return null;
  }
}
