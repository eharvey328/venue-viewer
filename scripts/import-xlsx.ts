import 'dotenv/config'
import * as XLSX from 'xlsx'
import path from 'path'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>

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
