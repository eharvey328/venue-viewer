# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
yarn dev              # start dev server
yarn build            # production build (runs tsc)
yarn lint             # ESLint
yarn format           # Prettier over src/**
```

Prisma migrations: `npx prisma migrate dev --name <name>`

## Architecture

Next.js 16 App Router. All pages are RSCs; interactive pieces are `"use client"` components.

**Data flow for reads:** RSC page → `src/lib/venues.ts` (Prisma queries) → render

**Data flow for writes:** client component → `useAction(serverAction)` from `next-safe-action/hooks` → `src/app/actions/` → `src/lib/venues.ts`

### Key directories

- `src/app/actions/` — server actions (`save-venue.ts`, `delete-venue.ts`). Each uses `actionClient.inputSchema(zodSchema).action(...)` from `src/lib/safe-action.ts`. Redirect errors must be caught and rethrown (`isRedirectError`).
- `src/lib/` — `db.ts` (Prisma singleton with PrismaNeon adapter), `venues.ts` (all DB queries), `photo.ts` (Google Places photo → Vercel Blob), `geocode.ts` (address → lat/lng/locality/country), `filters.ts` (URL param ↔ `VenueFilters` type).
- `src/components/` — client components. `VenueForm` handles both place-search mode (Google Places autocomplete via `/api/places/search`) and manual-entry mode.

### Database

PostgreSQL on Neon via `@prisma/adapter-neon`. The adapter is required — bare `new PrismaClient()` will fail. See `src/lib/db.ts` for the singleton pattern. Client is generated to `src/generated/prisma/`.

### Photos

On venue save, if a `photoName` (Google Places photo reference) is present, `src/lib/photo.ts` fetches the image and uploads it to Vercel Blob. The permanent blob URL is stored in `photoUrl`. The backfill script (`scripts/backfill-photos.ts`) does the same for existing venues in bulk.

## Required environment variables

```
DATABASE_URL              # Neon pooled connection string
DIRECT_URL                # Neon direct connection (for migrations)
GOOGLE_MAPS_API_KEY       # Google Maps + Places API (New) enabled
BLOB_READ_WRITE_TOKEN     # Vercel Blob (public store)
```
