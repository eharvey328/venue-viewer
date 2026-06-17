# Venue Media Embeds

## Goal

Add inline Google Maps and Instagram embeds to the venue detail page so both users can browse venue photos and content without leaving the app.

## Background

Currently each venue has a single cover photo (pulled from Google Places on save) and external links to Google Maps, Instagram, and the venue website. To understand a venue's aesthetic, spaces, and views, users have to click out. The goal is to bring that browsing inline.

## What we're building

Two embeds on the venue detail page, rendered automatically from fields that already exist on every venue:

1. **Google Maps embed** — constructed from `googlePlaceId`, rendered as an `<iframe>` using the public Maps place embed URL (free, no API cost). Gives access to the venue's full photo gallery and location inline.

2. **Instagram embed** — constructed from `instagramUrl`, rendered using Instagram's standard oEmbed blockquote + script approach. Shows the venue's Instagram feed inline. Requires the viewer to be logged into Instagram in their browser (accepted tradeoff — both users will be logged in).

Both embeds are conditional: they only render when the relevant field is present. If neither is available, the section is hidden entirely. Order: Maps first, then Instagram.

## What we're NOT building

- Photo highlights / pinning (deferred — no DB changes needed now)
- Manual photo uploads
- Additional Google Places API calls for more photos

## Architecture

No DB schema changes. Both embeds are derived from existing `Venue` fields.

### Components

- `src/components/GoogleMapsEmbed.tsx` — RSC. Accepts `googlePlaceId: string`, renders an `<iframe>` with the place embed URL.
- `src/components/InstagramEmbed.tsx` — `"use client"` component. Accepts `instagramUrl: string`, renders the `<blockquote>` markup and loads `//www.instagram.com/embed.js` in a `useEffect` on mount.

### Integration

`src/app/venues/[id]/page.tsx` imports both components and renders them conditionally below the existing venue info (address, sleeps, links section).

## Out of scope

- Changes to `src/app/actions/`
- Changes to `src/lib/`
- DB migrations
- Filter/list views
