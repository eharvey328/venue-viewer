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
