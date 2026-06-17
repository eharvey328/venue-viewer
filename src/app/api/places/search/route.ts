import { NextRequest, NextResponse } from 'next/server';
import { extractLocality } from '@/lib/locality';

interface AddressComponent {
  longText: string;
  types: string[];
}

interface PlacesResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
}

function getComponent(components: AddressComponent[], type: string) {
  return components.find((c) => c.types.includes(type))?.longText ?? null;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.googleMapsUri',
      },
      body: JSON.stringify({ textQuery: q, pageSize: 5 }),
    });

    const data = (await res.json()) as { places?: PlacesResult[] };
    const places = data.places ?? [];

    const results = places.map((p) => {
      const components = p.addressComponents ?? [];
      const locality = extractLocality((type) => getComponent(components, type));
      const country = getComponent(components, 'country');

      return {
        placeId: p.id,
        displayName: p.displayName?.text ?? null,
        formattedAddress: p.formattedAddress ?? null,
        locality,
        country,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        googleMapsUrl: p.googleMapsUri ?? null,
      };
    });

    return NextResponse.json(results);
  } catch (e) {
    console.error('GET /api/places/search:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
