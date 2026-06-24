/**
 * One-time migration: copy websiteUrl values from Venue into VenueLink rows,
 * fetching OG metadata for each. Run before dropping the websiteUrl column.
 *
 * Usage: npx tsx scripts/migrate-website-links.ts
 */
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client';
import { fetchOgMetadata } from '../src/lib/og';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) { console.error('No DATABASE_URL or DIRECT_URL set'); process.exit(1); }

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as Parameters<typeof PrismaClient>[0]);

async function main() {
  type Row = { id: number; websiteUrl: string };
  const venues = await prisma.$queryRaw<Row[]>`SELECT id, "websiteUrl" FROM "Venue" WHERE "websiteUrl" IS NOT NULL`;

  console.log(`Found ${venues.length} venues with websiteUrl`);

  for (const venue of venues) {
    const existing = await prisma.venueLink.findFirst({
      where: { venueId: venue.id, url: venue.websiteUrl },
    });
    if (existing) {
      console.log(`[skip] venue ${venue.id} already has link for ${venue.websiteUrl}`);
      continue;
    }

    console.log(`[migrate] venue ${venue.id}: ${venue.websiteUrl}`);
    const og = await fetchOgMetadata(venue.websiteUrl);
    await prisma.venueLink.create({
      data: {
        venueId: venue.id,
        url: venue.websiteUrl,
        ogTitle: og?.title ?? null,
        ogDescription: og?.description ?? null,
        ogImage: og?.image ?? null,
      },
    });
    console.log(`  → og: ${og?.title ?? '(none)'}`);
  }

  console.log('Done.');
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
