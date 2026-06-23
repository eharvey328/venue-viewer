# Client-Side Venue List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the home page venue list to a client-side fetch using react-query so back-navigation preserves scroll position natively.

**Architecture:** A new `/api/venues` route wraps the existing `getVenues()` DB query. A new `VenueListClient` client component reads URL params via `useSearchParams`, fetches via `useQuery`, and renders `FilterBar` + `VenueList`/`VenueMapDynamic`. The home page becomes a static shell. `ScrollRestorer` is deleted.

**Tech Stack:** Next.js 16 App Router, `@tanstack/react-query` v5, TypeScript, Tailwind CSS

## Global Constraints

- Next.js App Router only — no Pages Router patterns
- Tailwind CSS for all styling — no inline styles, no CSS modules
- TypeScript strict — no `any`, no `@ts-ignore`
- `@tanstack/react-query` v5 API (not v4) — `useQuery` signature is `useQuery({ queryKey, queryFn })`
- No new dependencies beyond `@tanstack/react-query`

---

### Task 1: Install react-query and add QueryClientProvider to layout

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/QueryProvider.tsx`
- Delete: `src/components/ScrollRestorer.tsx`

**Interfaces:**
- Produces: `QueryProvider` — `"use client"` wrapper that provides `QueryClient` to the tree. Used in `layout.tsx`.

React-query's `QueryClientProvider` requires `"use client"`. Since `layout.tsx` is an RSC, create a thin wrapper component to hold the client boundary.

- [ ] **Step 1: Install @tanstack/react-query**

```bash
yarn add @tanstack/react-query
```

Expected: package added to `package.json`, no errors.

- [ ] **Step 2: Create `src/components/QueryProvider.tsx`**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Update `src/app/layout.tsx`**

Remove `ScrollRestorer` import and usage. Add `QueryProvider` wrapping `{children}`:

```tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { QueryProvider } from '@/components/QueryProvider';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Venue Viewer',
  description: 'Browse European wedding venues',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Venue Viewer
            </Link>
            <Link href="/venues/new" className={buttonVariants({ size: 'sm' })}>
              + Add Venue
            </Link>
          </div>
        </header>
        <QueryProvider>
          <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Delete `src/components/ScrollRestorer.tsx`**

```bash
rm src/components/ScrollRestorer.tsx
```

- [ ] **Step 5: Verify build passes**

```bash
yarn build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/QueryProvider.tsx src/app/layout.tsx
git rm src/components/ScrollRestorer.tsx
git commit -m "feat: add QueryClientProvider, remove ScrollRestorer"
```

---

### Task 2: Add /api/venues route

**Files:**
- Create: `src/app/api/venues/route.ts`

**Interfaces:**
- Consumes: `getVenues(filters: VenueFilters)` from `@/lib/venues`, `parseFiltersFromParams(params: URLSearchParams)` from `@/lib/filters`
- Produces: `GET /api/venues?country=X&sleepsMin=Y&sort=Z&view=W` → `200 { venues: Venue[] }` where `Venue` matches the `select` fields from `getVenues`: `{ id, name, address, locality, country, lat, lng, sleeps, googleMapsUrl, photoUrl }`

- [ ] **Step 1: Create `src/app/api/venues/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getVenues } from '@/lib/venues';
import { parseFiltersFromParams } from '@/lib/filters';

export async function GET(request: NextRequest) {
  const filters = parseFiltersFromParams(request.nextUrl.searchParams);
  const venues = await getVenues(filters);
  return NextResponse.json({ venues });
}
```

- [ ] **Step 2: Verify build passes**

```bash
yarn build
```

Expected: clean build. The route appears in the build output as a dynamic route.

- [ ] **Step 3: Smoke-test the route manually**

```bash
yarn dev
```

Then in another terminal:
```bash
curl "http://localhost:3000/api/venues" | head -c 200
```

Expected: JSON with a `venues` array.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/venues/route.ts
git commit -m "feat: add /api/venues route"
```

---

### Task 3: Create VenueListClient and update home page

**Files:**
- Create: `src/components/VenueListClient.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes:
  - `GET /api/venues` from Task 2 — returns `{ venues: Venue[] }`
  - `FilterBar({ filters: VenueFilters, totalCount: number })` from `@/components/FilterBar`
  - `VenueList({ venues: Venue[] })` from `@/components/VenueList`
  - `VenueMapDynamic({ venues: Venue[] })` from `@/components/VenueMapDynamic`
  - `parseFiltersFromParams(params: URLSearchParams)` from `@/lib/filters`
  - `serializeFiltersToParams(filters: VenueFilters)` from `@/lib/filters`
  - `useQuery({ queryKey, queryFn })` from `@tanstack/react-query` (v5 API)
  - `useSearchParams()` from `next/navigation`
- Produces: `VenueListClient()` — renders the full venue list UI with filter bar

`Venue` type (matches `getVenues` select fields, reuse in this file):
```ts
interface Venue {
  id: number;
  name: string;
  address: string | null;
  locality: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  sleeps: number | null;
  googleMapsUrl: string | null;
  photoUrl: string | null;
}
```

- [ ] **Step 1: Create `src/components/VenueListClient.tsx`**

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FilterBar } from '@/components/FilterBar';
import { VenueList } from '@/components/VenueList';
import { VenueMapDynamic } from '@/components/VenueMapDynamic';
import { parseFiltersFromParams, serializeFiltersToParams } from '@/lib/filters';

interface Venue {
  id: number;
  name: string;
  address: string | null;
  locality: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  sleeps: number | null;
  googleMapsUrl: string | null;
  photoUrl: string | null;
}

async function fetchVenues(search: string): Promise<Venue[]> {
  const res = await fetch(`/api/venues${search ? `?${search}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch venues');
  const data = await res.json() as { venues: Venue[] };
  return data.venues;
}

export function VenueListClient() {
  const searchParams = useSearchParams();
  const filters = parseFiltersFromParams(searchParams);
  const queryKey = serializeFiltersToParams(filters);

  const { data: venues, isLoading, isError } = useQuery({
    queryKey: ['venues', queryKey],
    queryFn: () => fetchVenues(queryKey),
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">Failed to load venues</p>
        <p className="mt-1 text-sm">Try refreshing the page</p>
      </div>
    );
  }

  const venueList = venues ?? [];

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} totalCount={isLoading ? 0 : venueList.length} />
      {isLoading ? (
        <div className="py-20 text-center text-gray-400">Loading…</div>
      ) : filters.view === 'map' ? (
        <VenueMapDynamic venues={venueList} />
      ) : (
        <VenueList venues={venueList} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `src/app/page.tsx`**

```tsx
import { Suspense } from 'react';
import { VenueListClient } from '@/components/VenueListClient';

export default function Home() {
  return (
    <Suspense>
      <VenueListClient />
    </Suspense>
  );
}
```

Note: `Suspense` is required here because `VenueListClient` uses `useSearchParams()` — Next.js requires it to be wrapped in a Suspense boundary during SSR. The boundary has no fallback (renders nothing during SSR), so there is no layout shift on back-navigation. The client component handles its own loading state.

- [ ] **Step 3: Verify build passes**

```bash
yarn build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 4: Run dev server and manually verify**

```bash
yarn dev
```

Check:
- Home page loads and shows venue list
- Changing filters updates the list
- Clicking a venue and pressing back returns to the list at the same scroll position
- Map view still works

- [ ] **Step 5: Commit**

```bash
git add src/components/VenueListClient.tsx src/app/page.tsx
git commit -m "feat: convert venue list to client-side fetch with react-query"
```
