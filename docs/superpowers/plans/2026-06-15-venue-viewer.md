# Venue Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js web app deployed on Vercel that lets a couple browse, filter, and manage 48 European wedding venues imported from an Excel file, with a card list view and an interactive map view.

**Architecture:** Single Next.js 15 App Router application with RSC pages and client components only where interactivity is required. Neon (serverless Postgres) stores venues with geocoordinates; Prisma handles schema/migrations/queries. The home page is a tab-switcher between List and Map view, driven entirely by URL search params so filtered URLs are shareable.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma, Neon (Postgres), SheetJS (xlsx), Nominatim geocoding, Leaflet + react-leaflet, Vercel

---

## File Map

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` | Venue model definition |
| `scripts/import-xlsx.ts` | One-time import: read Excel, geocode, seed DB |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/filters.ts` | `VenueFilters` type, URL param parse/serialize |
| `src/lib/venues.ts` | All Prisma query functions |
| `src/app/layout.tsx` | Root layout with sticky nav |
| `src/app/page.tsx` | Home: FilterBar + List or Map based on `?view=` |
| `src/app/venues/[id]/page.tsx` | Venue detail page |
| `src/app/venues/new/page.tsx` | Add venue page |
| `src/app/venues/[id]/edit/page.tsx` | Edit venue page |
| `src/app/api/venues/route.ts` | POST /api/venues |
| `src/app/api/venues/[id]/route.ts` | PUT, DELETE /api/venues/[id] |
| `src/components/VenueCard.tsx` | Single venue card |
| `src/components/VenueList.tsx` | Card stack list |
| `src/components/VenueMap.tsx` | Leaflet map with pins (client-only) |
| `src/components/FilterBar.tsx` | Tab toggle + filter controls (client) |
| `src/components/VenueForm.tsx` | Shared add/edit form (client) |
| `src/components/DeleteButton.tsx` | Confirm + DELETE fetch (client) |

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1.1: Scaffold the Next.js project**

From inside `/Users/eharvey/Repos/venue-viewer`, run:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

Accept all prompts with Enter (defaults are fine).

- [ ] **Step 1.2: Install dependencies**

```bash
npm install prisma @prisma/client xlsx react-leaflet leaflet
npm install --save-dev tsx @types/leaflet
```

- [ ] **Step 1.3: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and a `.env` file with a `DATABASE_URL` placeholder.

- [ ] **Step 1.4: Set up Neon**

1. Go to [neon.tech](https://neon.tech), create a free account, create a project named "venue-viewer"
2. On the dashboard, find the **Connection string** — Neon gives you two:
   - **Pooled** (has `?pgbouncer=true` in the URL): for app runtime
   - **Direct** (no pgbouncer): for Prisma migrations CLI
3. Add both to `.env.local`:

```
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

4. Also add `DATABASE_URL` (the **direct/unpooled** URL) to `.env` so the Prisma CLI can use it for migrations:

```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

- [ ] **Step 1.5: Verify `.gitignore` covers secrets**

Confirm `.gitignore` contains (create-next-app adds these, but double-check):
```
.env
.env.local
.env*.local
```

- [ ] **Step 1.6: Commit bootstrap**

```bash
git add -A
git commit -m "feat: bootstrap Next.js project with Prisma, Leaflet, and xlsx"
```

---

## Task 2: Prisma Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 2.1: Write the schema**

Replace the contents of `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_UNPOOLED")
}

model Venue {
  id        Int      @id @default(autoincrement())
  name      String
  address   String?
  lat       Float?
  lng       Float?
  sleeps    Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

The `directUrl` is used by Prisma's CLI for migrations; `url` is used at runtime (and will be the pooled URL in production).

- [ ] **Step 2.2: Run the migration**

```bash
npx prisma migrate dev --name init
```

Expected output:
```
Applying migration `20260615000000_init`
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

- [ ] **Step 2.3: Verify in Prisma Studio (optional)**

```bash
npx prisma studio
```

Opens `http://localhost:5555`. Confirm the empty `Venue` table exists. Close when done.

- [ ] **Step 2.4: Commit**

```bash
git add prisma/
git commit -m "feat: add Venue schema and initial Prisma migration"
```

---

## Task 3: Lib Layer — DB, Filters, Venues

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/filters.ts`
- Create: `src/lib/venues.ts`

- [ ] **Step 3.1: Create the Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

This prevents Next.js hot-reload from creating hundreds of database connections. Without this singleton, each file save in dev spawns a new `PrismaClient` and you hit Neon's free-tier connection limit.

- [ ] **Step 3.2: Create the filter types and URL helpers**

Create `src/lib/filters.ts`:

```ts
export const KNOWN_COUNTRIES = ['France', 'Italy', 'Belgium', 'Portugal'] as const

export type SortOption = 'name_asc' | 'name_desc' | 'sleeps_asc' | 'sleeps_desc'
export type ViewOption = 'list' | 'map'

export interface VenueFilters {
  countries: string[]
  sleepsMin: number | null
  sort: SortOption
  view: ViewOption
}

export const DEFAULT_FILTERS: VenueFilters = {
  countries: [],
  sleepsMin: null,
  sort: 'name_asc',
  view: 'list',
}

export function parseFiltersFromParams(params: URLSearchParams): VenueFilters {
  const countries = params.getAll('country').filter(Boolean)
  const sleepsMinRaw = params.get('sleepsMin')
  const sleepsMin =
    sleepsMinRaw !== null && !isNaN(parseInt(sleepsMinRaw))
      ? parseInt(sleepsMinRaw)
      : null
  const sort = (params.get('sort') ?? 'name_asc') as SortOption
  const view = (params.get('view') ?? 'list') as ViewOption
  return { countries, sleepsMin, sort, view }
}

export function serializeFiltersToParams(filters: VenueFilters): string {
  const params = new URLSearchParams()
  filters.countries.forEach((c) => params.append('country', c))
  if (filters.sleepsMin !== null) params.set('sleepsMin', String(filters.sleepsMin))
  if (filters.sort !== 'name_asc') params.set('sort', filters.sort)
  if (filters.view !== 'list') params.set('view', filters.view)
  return params.toString()
}
```

- [ ] **Step 3.3: Create the venue query functions**

Create `src/lib/venues.ts`:

```ts
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import type { VenueFilters, SortOption } from './filters'

function buildOrderBy(sort: SortOption): Prisma.VenueOrderByWithRelationInput {
  switch (sort) {
    case 'name_asc':    return { name: 'asc' }
    case 'name_desc':   return { name: 'desc' }
    case 'sleeps_asc':  return { sleeps: { sort: 'asc', nulls: 'last' } }
    case 'sleeps_desc': return { sleeps: { sort: 'desc', nulls: 'last' } }
  }
}

export async function getVenues(filters: VenueFilters) {
  const where: Prisma.VenueWhereInput = {}

  if (filters.countries.length > 0) {
    where.OR = filters.countries.map((c) => ({
      address: { contains: c, mode: 'insensitive' as const },
    }))
  }

  if (filters.sleepsMin !== null) {
    where.sleeps = { gte: filters.sleepsMin }
  }

  return prisma.venue.findMany({
    where,
    orderBy: buildOrderBy(filters.sort),
    select: {
      id: true,
      name: true,
      address: true,
      lat: true,
      lng: true,
      sleeps: true,
    },
  })
}

export async function getVenueById(id: number) {
  return prisma.venue.findUnique({ where: { id } })
}

export async function createVenue(data: {
  name: string
  address?: string | null
  lat?: number | null
  lng?: number | null
  sleeps?: number | null
}) {
  return prisma.venue.create({ data })
}

export async function updateVenue(
  id: number,
  data: {
    name?: string
    address?: string | null
    lat?: number | null
    lng?: number | null
    sleeps?: number | null
  }
) {
  return prisma.venue.update({ where: { id }, data })
}

export async function deleteVenue(id: number) {
  return prisma.venue.delete({ where: { id } })
}
```

- [ ] **Step 3.4: Commit**

```bash
git add src/lib/
git commit -m "feat: add Prisma singleton, filter helpers, and venue query functions"
```

---

## Task 4: Import Script

**Files:**
- Create: `scripts/import-xlsx.ts`
- Modify: `package.json` (add script)

The spreadsheet has no dedicated "address" column. We construct a geocodable string from `Region` + `Country` (e.g. "Luberon, France"). The import geocodes each venue via Nominatim (free OpenStreetMap API, no key needed) and stores lat/lng.

- [ ] **Step 4.1: Create the import script**

Create `scripts/import-xlsx.ts`:

```ts
import * as XLSX from 'xlsx'
import path from 'path'
import { prisma } from '../src/lib/db'

const XLSX_PATH = path.join(
  process.env.HOME ?? '',
  'Downloads',
  'Harman Wedding.xlsx'
)

function parseSleeps(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === '') return null
  const s = String(raw).replace(/[~,]/g, '')
  const match = s.match(/\d+/)
  return match ? parseInt(match[0]) : null
}

function buildAddress(country: string | null | undefined, region: string | null | undefined): string | null {
  const parts = [region?.trim(), country?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'venue-viewer/1.0 (wedding venue research app)' },
    })
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const workbook = XLSX.readFile(XLSX_PATH)
  const sheet = workbook.Sheets['Venues']
  if (!sheet) throw new Error("No 'Venues' sheet found")

  const rows = XLSX.utils.sheet_to_json<{
    Name?: string
    Country?: string
    Region?: string
    Sleeps?: string | number
  }>(sheet, { defval: null })

  console.log(`Found ${rows.length} rows`)

  const deleted = await prisma.venue.deleteMany()
  console.log(`Cleared ${deleted.count} existing venues`)

  let inserted = 0
  let geocodeFailed = 0

  for (const row of rows) {
    const rawName = (row.Name ?? '').trim()
    if (!rawName) continue

    const name = rawName.replace('💙', '').trim()
    const address = buildAddress(row.Country, row.Region)
    const sleeps = parseSleeps(row.Sleeps)

    let lat: number | null = null
    let lng: number | null = null

    if (address) {
      const coords = await geocode(address)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        console.log(`  ✓ ${name} → ${address} (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
      } else {
        geocodeFailed++
        console.log(`  ✗ ${name} → ${address} (geocode failed)`)
      }
      // Nominatim rate limit: max 1 request/second
      await sleep(1100)
    }

    await prisma.venue.create({ data: { name, address, lat, lng, sleeps } })
    inserted++
  }

  console.log(`\nInserted ${inserted} venues (${geocodeFailed} geocode failures)`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
```

- [ ] **Step 4.2: Add npm script**

In `package.json`, add to the `"scripts"` object:

```json
"import-xlsx": "tsx scripts/import-xlsx.ts"
```

- [ ] **Step 4.3: Run the import**

```bash
npm run import-xlsx
```

Expected output (takes ~60 seconds due to 1 req/sec geocoding rate limit):
```
Found 48 rows
Cleared 0 existing venues
  ✓ Domaine des Andéols → Luberon, France (43.8xxx, 5.3xxx)
  ✓ Chateau Les Carrasses → Languedoc, France (43.2xxx, 2.9xxx)
  ...
Inserted 48 venues (N geocode failures)
```

If some geocode as failures, that's fine — those venues will appear in the list but not on the map. You can manually fix coordinates via Prisma Studio or the edit form later.

- [ ] **Step 4.4: Verify in Prisma Studio**

```bash
npx prisma studio
```

Open the `Venue` table. Confirm 48 rows, check that `lat`/`lng` are populated on most rows and that names are clean (no 💙 emoji).

- [ ] **Step 4.5: Commit**

```bash
git add scripts/ package.json
git commit -m "feat: add one-time Excel import script with Nominatim geocoding"
```

---

## Task 5: API Routes

**Files:**
- Create: `src/app/api/venues/route.ts`
- Create: `src/app/api/venues/[id]/route.ts`

- [ ] **Step 5.1: Create POST /api/venues**

Create `src/app/api/venues/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createVenue } from '@/lib/venues'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const venue = await createVenue({
      name: body.name.trim(),
      address: body.address?.trim() || null,
      lat: typeof body.lat === 'number' ? body.lat : null,
      lng: typeof body.lng === 'number' ? body.lng : null,
      sleeps: typeof body.sleeps === 'number' ? body.sleeps : null,
    })

    return NextResponse.json(venue, { status: 201 })
  } catch (e) {
    console.error('POST /api/venues:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5.2: Create PUT and DELETE /api/venues/[id]**

Create `src/app/api/venues/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getVenueById, updateVenue, deleteVenue } from '@/lib/venues'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const existing = await getVenueById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()

    if (body.name !== undefined && !body.name?.trim()) {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    }

    const venue = await updateVenue(id, {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.address !== undefined && { address: body.address?.trim() || null }),
      ...(body.lat !== undefined && { lat: typeof body.lat === 'number' ? body.lat : null }),
      ...(body.lng !== undefined && { lng: typeof body.lng === 'number' ? body.lng : null }),
      ...(body.sleeps !== undefined && { sleeps: typeof body.sleeps === 'number' ? body.sleeps : null }),
    })

    return NextResponse.json(venue)
  } catch (e) {
    console.error('PUT /api/venues/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const existing = await getVenueById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await deleteVenue(id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('DELETE /api/venues/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Critical:** In Next.js 15, route segment `params` is a `Promise`. You must `await params` before accessing `.id`. Forgetting this causes a type error at runtime.

- [ ] **Step 5.3: Smoke test**

Start dev server: `npm run dev`

In a second terminal:
```bash
# Create a test venue
curl -s -X POST http://localhost:3000/api/venues \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Venue","address":"Tuscany, Italy","sleeps":50}' | jq .
```
Expected: JSON with `"id"` field and `"name": "Test Venue"`.

```bash
# Delete it (replace 49 with the actual id returned above)
curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3000/api/venues/49
```
Expected: `204`

- [ ] **Step 5.4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add POST, PUT, DELETE API routes for venues"
```

---

## Task 6: Core Components

**Files:**
- Create: `src/components/VenueCard.tsx`
- Create: `src/components/VenueList.tsx`
- Create: `src/components/DeleteButton.tsx`

- [ ] **Step 6.1: Create VenueCard**

Create `src/components/VenueCard.tsx`:

```tsx
import Link from 'next/link'

interface VenueCardProps {
  id: number
  name: string
  address: string | null
  sleeps: number | null
}

export function VenueCard({ id, name, address, sleeps }: VenueCardProps) {
  return (
    <Link
      href={`/venues/${id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:shadow-none transition-shadow"
    >
      <h2 className="text-base font-semibold text-gray-900 leading-snug">{name}</h2>
      {address && (
        <p className="mt-1 text-sm text-gray-500 truncate">{address}</p>
      )}
      {sleeps != null && (
        <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Sleeps {sleeps}
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 6.2: Create VenueList**

Create `src/components/VenueList.tsx`:

```tsx
import { VenueCard } from './VenueCard'

interface Venue {
  id: number
  name: string
  address: string | null
  sleeps: number | null
}

export function VenueList({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No venues match these filters</p>
        <p className="mt-1 text-sm">Try adjusting or clearing filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((v) => (
        <VenueCard key={v.id} {...v} />
      ))}
    </div>
  )
}
```

- [ ] **Step 6.3: Create DeleteButton**

Create `src/components/DeleteButton.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteButton({ venueId, venueName }: { venueId: number; venueName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm(`Delete "${venueName}"? This cannot be undone.`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/venues/${venueId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/')
      router.refresh()
    } catch {
      alert('Failed to delete. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
```

- [ ] **Step 6.4: Commit**

```bash
git add src/components/VenueCard.tsx src/components/VenueList.tsx src/components/DeleteButton.tsx
git commit -m "feat: add VenueCard, VenueList, and DeleteButton components"
```

---

## Task 7: VenueForm Component

**Files:**
- Create: `src/components/VenueForm.tsx`

The form handles both add and edit. When `venueId` is provided it calls `PUT`; otherwise `POST`. The `address` field is a plain text input — no geocoding in the form (lat/lng from the import script; users can add coordinates via the form fields if they want to put a venue on the map).

- [ ] **Step 7.1: Create VenueForm**

Create `src/components/VenueForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VenueFormData {
  name: string
  address: string
  lat: string
  lng: string
  sleeps: string
}

interface VenueFormProps {
  venueId?: number
  initialData?: Partial<VenueFormData>
}

const EMPTY: VenueFormData = { name: '', address: '', lat: '', lng: '', sleeps: '' }

function labelClass() {
  return 'block text-sm font-medium text-gray-700 mb-1'
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
}

export function VenueForm({ venueId, initialData }: VenueFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<VenueFormData>({ ...EMPTY, ...initialData })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = venueId !== undefined

  function set(field: keyof VenueFormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }

    setLoading(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      sleeps: form.sleeps ? parseInt(form.sleeps) : null,
    }

    try {
      const res = isEditing
        ? await fetch(`/api/venues/${venueId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/venues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Request failed')
      }

      const venue = await res.json() as { id: number }
      router.push(`/venues/${venue.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label className={labelClass()}>Name <span className="text-red-500">*</span></label>
        <input type="text" value={form.name} onChange={set('name')} className={inputClass()} placeholder="Chateau Example" />
      </div>

      <div>
        <label className={labelClass()}>Address</label>
        <input type="text" value={form.address} onChange={set('address')} className={inputClass()} placeholder="Luberon, Provence, France" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass()}>Latitude</label>
          <input type="number" step="any" value={form.lat} onChange={set('lat')} className={inputClass()} placeholder="43.8123" />
        </div>
        <div>
          <label className={labelClass()}>Longitude</label>
          <input type="number" step="any" value={form.lng} onChange={set('lng')} className={inputClass()} placeholder="5.3456" />
        </div>
      </div>

      <div>
        <label className={labelClass()}>Sleeps</label>
        <input type="number" min="0" value={form.sleeps} onChange={set('sleeps')} className={inputClass()} placeholder="90" />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEditing ? 'Save changes' : 'Add venue'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/components/VenueForm.tsx
git commit -m "feat: add VenueForm component for add/edit"
```

---

## Task 8: FilterBar Component

**Files:**
- Create: `src/components/FilterBar.tsx`

Client component that owns the List/Map tab toggle, country pill filters, sleeps min input, and sort dropdown. All changes push to the URL via `router.push`.

- [ ] **Step 8.1: Create FilterBar**

Create `src/components/FilterBar.tsx`:

```tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  KNOWN_COUNTRIES,
  serializeFiltersToParams,
  type VenueFilters,
  type SortOption,
  type ViewOption,
} from '@/lib/filters'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'sleeps_asc', label: 'Sleeps ↑' },
  { value: 'sleeps_desc', label: 'Sleeps ↓' },
]

interface FilterBarProps {
  filters: VenueFilters
  totalCount: number
}

export function FilterBar({ filters, totalCount }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const update = useCallback(
    (updates: Partial<VenueFilters>) => {
      const next = { ...filters, ...updates }
      const qs = serializeFiltersToParams(next)
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [filters, pathname, router]
  )

  function toggleCountry(country: string) {
    const next = filters.countries.includes(country)
      ? filters.countries.filter((c) => c !== country)
      : [...filters.countries, country]
    update({ countries: next })
  }

  function setView(view: ViewOption) {
    update({ view })
  }

  const hasFilters =
    filters.countries.length > 0 || filters.sleepsMin !== null

  return (
    <div className="space-y-3">
      {/* View tab toggle */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 w-fit">
        {(['list', 'map'] as ViewOption[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filters.view === v
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v === 'list' ? '☰ List' : '🗺 Map'}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Country pills */}
        {KNOWN_COUNTRIES.map((c) => (
          <button
            key={c}
            onClick={() => toggleCountry(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filters.countries.includes(c)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}

        {/* Sleeps min */}
        <input
          type="number"
          min={0}
          placeholder="Min sleeps"
          value={filters.sleepsMin ?? ''}
          onChange={(e) =>
            update({ sleepsMin: e.target.value ? parseInt(e.target.value) : null })
          }
          className="w-28 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Sort (hidden in map view) */}
        {filters.view === 'list' && (
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        {/* Count + clear */}
        <span className="ml-auto text-sm text-gray-400">
          {totalCount} venue{totalCount !== 1 ? 's' : ''}
        </span>
        {hasFilters && (
          <button
            onClick={() => router.push(pathname + (filters.view !== 'list' ? `?view=${filters.view}` : ''))}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: add FilterBar with tab toggle, country pills, and sort"
```

---

## Task 9: VenueMap Component

**Files:**
- Create: `src/components/VenueMap.tsx`

Leaflet requires `window` and cannot run server-side. This component is always loaded via `dynamic(..., { ssr: false })` from the page. Each venue with lat/lng gets a pin; tapping a pin shows a popup with name, sleeps, and a detail link.

- [ ] **Step 9.1: Create VenueMap**

Create `src/components/VenueMap.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

// Fix Leaflet's default icon broken by webpack/Next.js asset handling
function useLeafletIconFix() {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }, [])
}

interface VenueMapVenue {
  id: number
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  sleeps: number | null
}

interface VenueMapProps {
  venues: VenueMapVenue[]
}

export default function VenueMap({ venues }: VenueMapProps) {
  useLeafletIconFix()

  const mapped = venues.filter((v): v is VenueMapVenue & { lat: number; lng: number } =>
    v.lat !== null && v.lng !== null
  )
  const unmappedCount = venues.length - mapped.length

  // Center on centroid of mapped venues, fallback to France
  const center: [number, number] =
    mapped.length > 0
      ? [
          mapped.reduce((sum, v) => sum + v.lat, 0) / mapped.length,
          mapped.reduce((sum, v) => sum + v.lng, 0) / mapped.length,
        ]
      : [46.5, 2.5]

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={5}
        className="h-[calc(100dvh-160px)] w-full rounded-xl"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapped.map((v) => (
          <Marker key={v.id} position={[v.lat, v.lng]}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-gray-900">{v.name}</p>
                {v.address && <p className="text-xs text-gray-500 mt-0.5">{v.address}</p>}
                {v.sleeps != null && (
                  <p className="text-xs text-blue-700 mt-1">Sleeps {v.sleeps}</p>
                )}
                <Link
                  href={`/venues/${v.id}`}
                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {unmappedCount > 0 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          {unmappedCount} venue{unmappedCount !== 1 ? 's' : ''} not shown (no coordinates)
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 9.2: Commit**

```bash
git add src/components/VenueMap.tsx
git commit -m "feat: add Leaflet map component with venue pins and popups"
```

---

## Task 10: Pages

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/venues/[id]/page.tsx`
- Create: `src/app/venues/new/page.tsx`
- Create: `src/app/venues/[id]/edit/page.tsx`

- [ ] **Step 10.1: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Venue Viewer',
  description: 'Browse European wedding venues',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-gray-900">
              Venue Viewer
            </Link>
            <Link
              href="/venues/new"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Add Venue
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 10.2: Update the home page**

Replace `src/app/page.tsx`:

```tsx
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { VenueList } from '@/components/VenueList'
import { FilterBar } from '@/components/FilterBar'
import { getVenues } from '@/lib/venues'
import { parseFiltersFromParams } from '@/lib/filters'

const VenueMap = dynamic(() => import('@/components/VenueMap'), { ssr: false })

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function HomeContent({ searchParams }: HomeProps) {
  const resolved = await searchParams
  const urlParams = new URLSearchParams()
  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) value.forEach((v) => urlParams.append(key, v))
    else if (value !== undefined) urlParams.set(key, value)
  }

  const filters = parseFiltersFromParams(urlParams)
  const venues = await getVenues(filters)

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} totalCount={venues.length} />
      {filters.view === 'map' ? (
        <VenueMap venues={venues} />
      ) : (
        <VenueList venues={venues} />
      )}
    </div>
  )
}

export default function Home(props: HomeProps) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading…</div>}>
      <HomeContent {...props} />
    </Suspense>
  )
}
```

- [ ] **Step 10.3: Create the venue detail page**

Create `src/app/venues/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getVenueById } from '@/lib/venues'
import { DeleteButton } from '@/components/DeleteButton'

interface Props {
  params: Promise<{ id: string }>
}

export default async function VenueDetailPage({ params }: Props) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const venue = await getVenueById(id)
  if (!venue) notFound()

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{venue.name}</h1>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/venues/${venue.id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteButton venueId={venue.id} venueName={venue.name} />
        </div>
      </div>

      {venue.address && (
        <p className="mt-2 text-gray-500">{venue.address}</p>
      )}

      {venue.sleeps != null && (
        <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Sleeps {venue.sleeps}
        </span>
      )}

      {(venue.lat != null && venue.lng != null) && (
        <p className="mt-3 text-xs text-gray-400">
          {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 10.4: Create the Add venue page**

Create `src/app/venues/new/page.tsx`:

```tsx
import { VenueForm } from '@/components/VenueForm'

export default function NewVenuePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Venue</h1>
      <VenueForm />
    </div>
  )
}
```

- [ ] **Step 10.5: Create the Edit venue page**

Create `src/app/venues/[id]/edit/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getVenueById } from '@/lib/venues'
import { VenueForm } from '@/components/VenueForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditVenuePage({ params }: Props) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const venue = await getVenueById(id)
  if (!venue) notFound()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit: {venue.name}</h1>
      <VenueForm
        venueId={venue.id}
        initialData={{
          name: venue.name,
          address: venue.address ?? '',
          lat: venue.lat != null ? String(venue.lat) : '',
          lng: venue.lng != null ? String(venue.lng) : '',
          sleeps: venue.sleeps != null ? String(venue.sleeps) : '',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 10.6: Start the dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000`:
1. Confirm 48 venue cards render in list view
2. Click "Map" tab → Leaflet map with pins loads
3. Tap a pin → popup shows name and "View details →" link
4. Click France pill → list narrows to French venues; tap Map tab → map shows only French venues
5. Click a card → detail page shows name, address, sleeps
6. Click Edit → form prefilled correctly; save → returns to detail page
7. Click Delete → confirm dialog → redirects to home
8. Click "+ Add Venue" → add a test venue → appears in list

- [ ] **Step 10.7: Commit**

```bash
git add src/app/
git commit -m "feat: add all pages — home, detail, new, edit"
```

---

## Task 11: Vercel Deployment

**Files:**
- Modify: `prisma/schema.prisma` (already has `directUrl` — verify)

- [ ] **Step 11.1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/venue-viewer.git
git push -u origin main
```

- [ ] **Step 11.2: Create Vercel project**

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub → select `venue-viewer`
2. Framework preset auto-detects as Next.js — leave defaults

- [ ] **Step 11.3: Add environment variables**

In the Vercel project → Settings → Environment Variables, add:

| Name | Value | Environments |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** connection string | Production, Preview, Development |
| `DATABASE_URL_UNPOOLED` | Neon **direct** connection string | Production, Preview, Development |

- [ ] **Step 11.4: Deploy**

Trigger a deploy from the Vercel dashboard or push a commit. Wait for the build to complete.

- [ ] **Step 11.5: Verify production**

Open the Vercel production URL:
1. All 48 venues load in list view
2. Map view shows pins in France, Italy, Belgium, Portugal
3. Test on mobile browser (or DevTools mobile mode): cards are readable, map is full-height and usable, tapping a pin shows the popup

---

## Verification Checklist

- [ ] `npm run dev` → 48 cards in list view
- [ ] Map tab → pins visible; tapping a pin shows popup with "View details →"
- [ ] Country filter (France pill) narrows both list and map to French venues
- [ ] Sleeps min filter (e.g. 50) hides small venues
- [ ] Filtered URL: copy URL with filters → open in new tab → same state
- [ ] Add venue → appears in list
- [ ] Edit venue → saved changes show on detail page
- [ ] Delete venue → gone from list
- [ ] Vercel production URL works on real mobile device
