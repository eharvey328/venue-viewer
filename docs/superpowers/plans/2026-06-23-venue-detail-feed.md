# Venue Detail Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the venue detail page into a categorical feed with a Links section (website card with OG metadata + Google Maps card) and a Social section (Instagram embed), plus a placeholder "+ Add Media" button.

**Architecture:** Static section components read directly from the existing `Venue` model — no new DB tables. `WebsiteCard` is a client component that fetches OG metadata from a new `/api/og` route via React Query and falls back to a simple card on failure. All sections are hidden when they have no content.

**Tech Stack:** Next.js 16 App Router, React 19, @tanstack/react-query v5, Tailwind CSS v4, TypeScript

## Global Constraints

- No new DB tables or Prisma migrations
- All new components in `src/app/venues/[id]/`
- Use Tailwind utility classes only — no new CSS files
- OG route timeout: 2000ms via `AbortController`
- OG route returns `{ title: string | null, description: string | null, image: string | null }` or `null` on any error
- `next/image` is NOT used for OG images (external URLs are not in the allowlist — use a plain `<img>` tag)
- Existing `InstagramEmbed` component is not modified

---

### Task 1: `/api/og` route

**Files:**
- Create: `src/app/api/og/route.ts`

**Interfaces:**
- Produces: `GET /api/og?url=<encoded>` → `{ title: string | null, description: string | null, image: string | null } | null`

- [ ] **Step 1: Create the route file**

```ts
// src/app/api/og/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json(null, { status: 400 });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VenueViewer/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json(null);

    const html = await res.text();

    function getMeta(property: string): string | null {
      const match =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ??
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return match?.[1] ?? null;
    }

    return NextResponse.json({
      title: getMeta('og:title'),
      description: getMeta('og:description'),
      image: getMeta('og:image'),
    });
  } catch {
    return NextResponse.json(null);
  }
}
```

- [ ] **Step 2: Verify build compiles**

```bash
yarn build 2>&1 | grep -E "error|Error|✓"
```

Expected: no TypeScript errors, route appears in build output as `ƒ /api/og`

- [ ] **Step 3: Manual smoke test**

Start dev server (`yarn dev`), then open:
```
http://localhost:3000/api/og?url=https%3A%2F%2Fexample.com
```
Expected: JSON response with `title`, `description`, `image` fields (may be null for example.com)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/og/route.ts
git commit -m "feat: add /api/og route for OG metadata fetching"
```

---

### Task 2: `SectionHeader` + `GoogleMapsCard`

**Files:**
- Create: `src/app/venues/[id]/SectionHeader.tsx`
- Create: `src/app/venues/[id]/GoogleMapsCard.tsx`

**Interfaces:**
- Produces: `<SectionHeader label={string} />` — renders an all-caps label with a horizontal rule
- Produces: `<GoogleMapsCard url={string} address={string | null} />` — green-tinted card, always simple

- [ ] **Step 1: Create SectionHeader**

```tsx
// src/app/venues/[id]/SectionHeader.tsx
export function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
```

- [ ] **Step 2: Create GoogleMapsCard**

```tsx
// src/app/venues/[id]/GoogleMapsCard.tsx
import { MapPin } from 'lucide-react';

export function GoogleMapsCard({ url, address }: { url: string; address: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 hover:bg-green-100 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
        <MapPin size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-green-900">View on Google Maps</p>
        {address && (
          <p className="text-xs text-green-700 truncate">{address}</p>
        )}
      </div>
      <span className="ml-auto text-green-600 text-sm">→</span>
    </a>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
yarn build 2>&1 | grep -E "error|Error|✓"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/venues/[id]/SectionHeader.tsx src/app/venues/[id]/GoogleMapsCard.tsx
git commit -m "feat: add SectionHeader and GoogleMapsCard components"
```

---

### Task 3: `WebsiteCard`

**Files:**
- Create: `src/app/venues/[id]/WebsiteCard.tsx`

**Interfaces:**
- Consumes: `GET /api/og?url=<encoded>` → `{ title, description, image } | null` (from Task 1)
- Produces: `<WebsiteCard url={string} />` — client component, rich on OG success, simple fallback

- [ ] **Step 1: Create WebsiteCard**

```tsx
// src/app/venues/[id]/WebsiteCard.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';

interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
}

export function WebsiteCard({ url }: { url: string }) {
  const domain = new URL(url).hostname.replace(/^www\./, '');

  const { data: og } = useQuery<OgData | null>({
    queryKey: ['og', url],
    queryFn: async () => {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      return res.json();
    },
    staleTime: Infinity,
  });

  const isRich = og && (og.title || og.image);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {isRich && og.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={og.image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover bg-gray-100"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <Globe size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {isRich && og.title ? (
          <>
            <p className="text-sm font-medium text-gray-900 truncate">{og.title}</p>
            {og.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{og.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{domain}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900">{domain}</p>
            <p className="text-xs text-gray-400">Visit website</p>
          </>
        )}
      </div>
      <span className="ml-auto text-gray-400 text-sm shrink-0">→</span>
    </a>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
yarn build 2>&1 | grep -E "error|Error|✓"
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/venues/[id]/WebsiteCard.tsx
git commit -m "feat: add WebsiteCard with OG metadata and simple fallback"
```

---

### Task 4: `LinksSection` + `SocialSection`

**Files:**
- Create: `src/app/venues/[id]/LinksSection.tsx`
- Create: `src/app/venues/[id]/SocialSection.tsx`

**Interfaces:**
- Consumes: `<SectionHeader label={string} />` (Task 2), `<GoogleMapsCard url address />` (Task 2), `<WebsiteCard url />` (Task 3), `<InstagramEmbed instagramUrl />` (existing)
- Produces: `<LinksSection websiteUrl address googleMapsUrl />` — hidden when both URLs are absent
- Produces: `<SocialSection instagramUrl />` — hidden when instagramUrl is absent

- [ ] **Step 1: Create LinksSection**

```tsx
// src/app/venues/[id]/LinksSection.tsx
import { SectionHeader } from './SectionHeader';
import { WebsiteCard } from './WebsiteCard';
import { GoogleMapsCard } from './GoogleMapsCard';

interface Props {
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  address: string | null;
}

export function LinksSection({ websiteUrl, googleMapsUrl, address }: Props) {
  if (!websiteUrl && !googleMapsUrl) return null;

  return (
    <div>
      <SectionHeader label="Links" />
      <div className="flex flex-col gap-2">
        {websiteUrl && <WebsiteCard url={websiteUrl} />}
        {googleMapsUrl && <GoogleMapsCard url={googleMapsUrl} address={address} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create SocialSection**

```tsx
// src/app/venues/[id]/SocialSection.tsx
import { SectionHeader } from './SectionHeader';
import { InstagramEmbed } from './InstagramEmbed';

export function SocialSection({ instagramUrl }: { instagramUrl: string }) {
  return (
    <div>
      <SectionHeader label="Social" />
      <InstagramEmbed instagramUrl={instagramUrl} />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
yarn build 2>&1 | grep -E "error|Error|✓"
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/venues/[id]/LinksSection.tsx src/app/venues/[id]/SocialSection.tsx
git commit -m "feat: add LinksSection and SocialSection components"
```

---

### Task 5: Wire up `VenueDetail`

**Files:**
- Modify: `src/app/venues/[id]/VenueDetail.tsx`

**Interfaces:**
- Consumes: `<LinksSection websiteUrl googleMapsUrl address />` (Task 4), `<SocialSection instagramUrl />` (Task 4)

- [ ] **Step 1: Update VenueDetail**

Replace the entire file with:

```tsx
// src/app/venues/[id]/VenueDetail.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { DeleteButton } from './DeleteButton';
import { LinksSection } from './LinksSection';
import { SocialSection } from './SocialSection';

interface Venue {
  id: number;
  name: string;
  address: string | null;
  sleeps: number | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
}

export function VenueDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: venue, isLoading } = useQuery<Venue>({
    queryKey: ['venue', id],
    queryFn: async () => {
      const res = await fetch(`/api/venues/${id}`);
      if (res.status === 404) {
        router.replace('/not-found');
        return null as unknown as Venue;
      }
      return res.json();
    },
  });

  if (isLoading || !venue) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

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

      <div className="mt-6">
        <Button variant="outline" className="w-full" disabled>
          + Add Media
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <LinksSection
          websiteUrl={venue.websiteUrl}
          googleMapsUrl={venue.googleMapsUrl}
          address={venue.address}
        />
        {venue.instagramUrl && <SocialSection instagramUrl={venue.instagramUrl} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run full build**

```bash
yarn build 2>&1 | tail -20
```

Expected: clean build, no TypeScript errors

- [ ] **Step 3: Manual test in browser**

```bash
yarn dev
```

Navigate to a venue that has a website URL, Google Maps URL, and Instagram URL. Verify:
- "+ Add Media" button appears below the header, full width, disabled
- Links section appears with website card (rich if OG loads, simple fallback otherwise)
- Google Maps card is green-tinted with map pin icon
- Social section shows Instagram embed
- Sections with no content are absent (test with a venue missing some fields)

- [ ] **Step 4: Commit**

```bash
git add src/app/venues/[id]/VenueDetail.tsx
git commit -m "feat: restructure venue detail as categorical feed"
```
