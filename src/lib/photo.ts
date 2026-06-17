import { put } from '@vercel/blob';

export async function fetchAndUploadPhoto(
  photoName: string,
  venueName: string
): Promise<string | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  try {
    // Use skipHttpRedirect to get the photoUri as JSON rather than following a redirect
    const metaRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${key}`
    );
    if (!metaRes.ok) return null;

    const { photoUri } = (await metaRes.json()) as { photoUri?: string };
    if (!photoUri) return null;

    const imgRes = await fetch(photoUri);
    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    const buffer = await imgRes.arrayBuffer();

    const slug = venueName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const ext = contentType.includes('png') ? 'png' : 'jpg';

    const { url } = await put(`venues/${slug}-${Date.now()}.${ext}`, buffer, {
      access: 'public',
      contentType,
    });

    return url;
  } catch (e) {
    console.error('fetchAndUploadPhoto:', e);
    return null;
  }
}
