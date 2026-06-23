# Client-Side Venue List

## Goal

Convert the home page venue list from a server-rendered RSC to a client-side fetch using react-query, so back-navigation uses the router cache and scroll position is preserved natively without Suspense re-rendering.

## Problem

The home page is a dynamic RSC that re-fetches on every navigation. On back-navigation, Next.js re-renders through the Suspense boundary, briefly showing the fallback at near-zero height before content loads — resetting scroll to top. Custom scroll restoration hacks are fragile.

## Solution

Move venue fetching to the client via react-query. The page shell renders instantly from cache; venue data fetches client-side. Back-navigation hits react-query's cache and renders instantly with no Suspense, restoring native browser scroll restoration.

## What we're building

- `GET /api/venues` — thin API route wrapping `getVenues()`, accepts filter params
- `VenueListClient` — `"use client"` component using `useSearchParams` + `useQuery`
- Updated home page — static shell, no async/Suspense
- `QueryClientProvider` in layout
- Remove `ScrollRestorer` entirely

## Data flow

`FilterBar` updates URL params → `useSearchParams` in `VenueListClient` detects change → `useQuery` re-fetches `/api/venues?...` → `VenueList` or `VenueMapDynamic` renders. react-query caches by serialized filter params.

## What we're NOT building

- Pagination
- Optimistic updates
- Infinite scroll

## Files

- Create: `src/app/api/venues/route.ts`
- Create: `src/components/VenueListClient.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Delete: `src/components/ScrollRestorer.tsx`
- No changes to: `FilterBar`, `VenueList`, `VenueMapDynamic`, `src/lib/venues.ts`

## Error handling

`isError` from `useQuery` renders a "Failed to load venues" message in the same style as the empty state.

## Dependencies

- Add `@tanstack/react-query`
