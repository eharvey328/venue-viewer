import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client';
import { put } from '@vercel/blob';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!GOOGLE_KEY) throw new Error('Missing GOOGLE_MAPS_API_KEY');
if (!BLOB_TOKEN) throw new Error('Missing BLOB_READ_WRITE_TOKEN');

async function searchPlace(name: string): Promise<string | null> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY!,
      'X-Goog-FieldMask': 'places.id,places.photos',
    },
    body: JSON.stringify({ textQuery: name, pageSize: 1 }),
  });
  const data = (await res.json()) as { places?: { id: string; photos?: { name: string }[] }[] };
  return data.places?.[0]?.photos?.[0]?.name ?? null;
}

async function uploadPhoto(photoName: string, venueName: string): Promise<string | null> {
  const metaRes = await fetch(
    `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${GOOGLE_KEY}`
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
    token: BLOB_TOKEN,
  });
  return url;
}

async function main() {
  const venues = await prisma.venue.findMany({
    where: { photoUrl: null },
    select: { id: true, name: true },
  });

  console.log(`Found ${venues.length} venues without photos`);

  for (const venue of venues) {
    process.stdout.write(`  ${venue.name} … `);
    try {
      const photoName = await searchPlace(venue.name);
      if (!photoName) {
        console.log('no photo found');
        continue;
      }

      const photoUrl = await uploadPhoto(photoName, venue.name);
      if (!photoUrl) {
        console.log('upload failed');
        continue;
      }

      await prisma.venue.update({ where: { id: venue.id }, data: { photoUrl } });
      console.log('✓');
    } catch (e) {
      console.log(`error: ${e}`);
    }

    // Respect Places API rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('Done');
  await prisma.$disconnect();
}

main();
