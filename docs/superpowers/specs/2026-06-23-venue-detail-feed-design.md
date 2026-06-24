# Venue Detail Feed — Design Spec

## Overview

Restructure the venue detail page from a flat list into a categorical feed. Each category is a hardcoded section component. All data comes from the existing `Venue` model — no new DB tables required.

## Layout

Vertical stack:

1. Hero photo (unchanged)
2. Name, address, sleeps, Edit/Delete controls (unchanged)
3. Full-width "+ Add Media" button
4. **Links** section (if any links exist)
5. **Social** section (if instagramUrl exists)

Sections with no content are hidden entirely.

## "+ Add Media" Button

Full-width button below the venue header. Placeholder only for now — no modal, no action. Will be wired up when media features (photos, notes, PDFs) are specced.

## Links Section

Header label: "Links"

### Website card

- Fetches OG metadata via `/api/og?url=...` (server-side, 2s timeout)
- **Rich variant** (on success): small `og:image` thumbnail on the left, `og:title` as heading, `og:description` truncated to 2 lines, domain as caption
- **Simple fallback**: globe icon, domain name, external link arrow
- Full card is clickable, opens URL in new tab

### Google Maps card

- Always simple — no OG fetch
- Green-tinted background, map pin icon, "View on Google Maps" label, venue address as caption
- Full card is clickable, opens Google Maps in new tab

## Social Section

Header label: "Social"

Contains the existing `InstagramEmbed` component, unchanged.

## Architecture

### New files

- `src/app/venues/[id]/LinksSection.tsx` — renders website + Google Maps cards
- `src/app/venues/[id]/SocialSection.tsx` — wraps `InstagramEmbed` with section header
- `src/app/venues/[id]/WebsiteCard.tsx` — client component; calls `/api/og` via `useQuery`, renders rich variant on success, simple fallback on null/error
- `src/app/venues/[id]/GoogleMapsCard.tsx` — simple styled card (no data fetching)
- `src/app/api/og/route.ts` — GET handler, fetches URL, parses OG tags, returns `{ title, description, image }` or `null` on failure

### Modified files

- `src/app/venues/[id]/VenueDetail.tsx` — replaces current link rendering with section components, adds "+ Add Media" button

### Section header pattern

Each section uses a consistent `<SectionHeader label="..." />` component (inline or shared) — a small all-caps label with a horizontal rule.

## OG API Route

```
GET /api/og?url=<encoded-url>
```

- Fetches the URL with a 2s `AbortController` timeout
- Parses `<meta property="og:title">`, `og:description`, `og:image`
- Returns `{ title, description, image }` or `null` on any error
- React Query caches the result for the session (no server-side persistence)

## Out of Scope

- Media upload modal (deferred)
- Photos, notes, PDF sections (deferred — separate spec)
- OG caching / persistence
