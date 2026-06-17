# Venue Media Embeds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline Google Maps and Instagram embeds to the venue detail page so users can browse venue photos without leaving the app.

**Architecture:** Two new components (`GoogleMapsEmbed`, `InstagramEmbed`) are imported into the existing venue detail RSC and rendered conditionally based on the presence of `googlePlaceId` and `instagramUrl`. No DB changes. No new API calls.

**Tech Stack:** Next.js 16 App Router, React, Tailwind CSS, TypeScript

## Global Constraints

- Next.js App Router only — no Pages Router patterns
- All new server-renderable components are RSCs (no `"use client"` unless interactivity or browser APIs are required)
- Tailwind CSS for all styling — no inline styles, no CSS modules
- TypeScript strict — no `any`, no `@ts-ignore`
- No new dependencies

---

### Task 1: GoogleMapsEmbed component

**Files:**
- Create: `src/components/GoogleMapsEmbed.tsx`
- Modify: `next.config.ts` (add `frame-src` CSP header or confirm iframe is allowed)

**Interfaces:**
- Produces: `GoogleMapsEmbed({ googlePlaceId: string }): JSX.Element` — renders an iframe with the Maps place embed URL

The Google Maps place embed URL format is:
`https://www.google.com/maps/embed/v1/place?key=YOUR_KEY&q=place_id:PLACE_ID`

However, the **keyless** embed format also works for the basic place viewer:
`https://maps.google.com/maps?q=place_id:PLACE_ID&output=embed`

Use the keyless format to avoid exposing the API key in client-rendered HTML.

- [ ] **Step 1: Create `GoogleMapsEmbed.tsx`**

```tsx
// src/components/GoogleMapsEmbed.tsx
interface GoogleMapsEmbedProps {
  googlePlaceId: string;
}

export function GoogleMapsEmbed({ googlePlaceId }: GoogleMapsEmbedProps) {
  const src = `https://maps.google.com/maps?q=place_id:${googlePlaceId}&output=embed`;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-gray-700">Location &amp; Photos</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <iframe
          src={src}
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
yarn build
```

Expected: no TypeScript or lint errors. If you see a CSP iframe error at runtime (not build time), proceed to Step 3; otherwise skip it.

- [ ] **Step 3: (If needed) Allow Google Maps iframes in next.config.ts**

If the iframe is blocked by Content Security Policy at runtime, add a `headers` config to `next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://maps.google.com https://www.instagram.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 4: Commit**

```bash
git add src/components/GoogleMapsEmbed.tsx next.config.ts
git commit -m "feat: add GoogleMapsEmbed component"
```

---

### Task 2: InstagramEmbed component

**Files:**
- Create: `src/components/InstagramEmbed.tsx`

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: `InstagramEmbed({ instagramUrl: string }): JSX.Element` — renders an Instagram embed blockquote and loads the embed script on mount

Instagram's embed works by rendering a `<blockquote class="instagram-media">` with the post/profile URL as `data-instgrm-permalink`, then loading `//www.instagram.com/embed.js` which transforms it into a full embed widget. For a venue's profile page (not a single post), the blockquote permalink is the profile URL itself.

Note: Instagram embeds require the viewer to be logged in. This is an accepted tradeoff.

- [ ] **Step 1: Create `InstagramEmbed.tsx`**

```tsx
// src/components/InstagramEmbed.tsx
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

interface InstagramEmbedProps {
  instagramUrl: string;
}

export function InstagramEmbed({ instagramUrl }: InstagramEmbedProps) {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-gray-700">Instagram</h2>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={instagramUrl}
        data-instgrm-version="14"
        style={{ maxWidth: '100%', width: '100%', margin: 0 }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
yarn build
```

Expected: no TypeScript or lint errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/InstagramEmbed.tsx
git commit -m "feat: add InstagramEmbed component"
```

---

### Task 3: Wire embeds into the venue detail page

**Files:**
- Modify: `src/app/venues/[id]/page.tsx`

**Interfaces:**
- Consumes:
  - `GoogleMapsEmbed({ googlePlaceId: string })` from `@/components/GoogleMapsEmbed`
  - `InstagramEmbed({ instagramUrl: string })` from `@/components/InstagramEmbed`
- Produces: updated venue detail page with both embeds rendered conditionally below the links section

The existing links section ends at line 91 (`</div>`). The embeds go after that, before the outer closing `</div>`.

- [ ] **Step 1: Update `src/app/venues/[id]/page.tsx`**

Add imports at the top:

```tsx
import { GoogleMapsEmbed } from '@/components/GoogleMapsEmbed';
import { InstagramEmbed } from '@/components/InstagramEmbed';
```

Add the embeds section after the links `</div>` (after line 91), before the outer closing `</div>`:

```tsx
      {(venue.googlePlaceId || venue.instagramUrl) && (
        <div className="mt-2">
          {venue.googlePlaceId && (
            <GoogleMapsEmbed googlePlaceId={venue.googlePlaceId} />
          )}
          {venue.instagramUrl && (
            <InstagramEmbed instagramUrl={venue.instagramUrl} />
          )}
        </div>
      )}
```

The full updated return statement becomes:

```tsx
  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back
      </Link>

      {venue.photoUrl && (
        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={venue.photoUrl}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
            priority
          />
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{venue.name}</h1>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/venues/${venue.id}/edit`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Edit
          </Link>
          <DeleteButton venueId={venue.id} venueName={venue.name} />
        </div>
      </div>

      {venue.address && <p className="mt-2 text-gray-500">{venue.address}</p>}

      {venue.sleeps != null && (
        <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Sleeps {venue.sleeps}
        </span>
      )}

      <div className="mt-3 flex flex-col gap-1">
        {venue.websiteUrl && (
          <a
            href={venue.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Visit website →
          </a>
        )}
        {venue.instagramUrl && (
          <a
            href={venue.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Instagram →
          </a>
        )}
        {venue.googleMapsUrl && (
          <a
            href={venue.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View on Google Maps →
          </a>
        )}
      </div>

      {(venue.googlePlaceId || venue.instagramUrl) && (
        <div className="mt-2">
          {venue.googlePlaceId && (
            <GoogleMapsEmbed googlePlaceId={venue.googlePlaceId} />
          )}
          {venue.instagramUrl && (
            <InstagramEmbed instagramUrl={venue.instagramUrl} />
          )}
        </div>
      )}
    </div>
  );
```

- [ ] **Step 2: Verify build passes**

```bash
yarn build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Run dev server and manually verify**

```bash
yarn dev
```

Open a venue that has a `googlePlaceId` — confirm the Maps embed renders below the links section.
Open a venue that has an `instagramUrl` — confirm the Instagram embed renders (you must be logged into Instagram).
Open a venue with neither — confirm no embed section appears.

- [ ] **Step 4: Commit**

```bash
git add src/app/venues/\[id\]/page.tsx
git commit -m "feat: wire Google Maps and Instagram embeds into venue detail page"
```
