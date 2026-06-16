'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface PlaceSuggestion {
  placeId: string
  displayName: string | null
  formattedAddress: string | null
  locality: string | null
  country: string | null
  lat: number | null
  lng: number | null
  googleMapsUrl: string | null
}

interface PlaceData {
  address: string
  locality: string | null
  country: string | null
  lat: number | null
  lng: number | null
  googleMapsUrl: string | null
}

interface VenueFormProps {
  venueId?: number
  initialData?: {
    name?: string
    address?: string
    sleeps?: string
  }
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
}

function labelClass() {
  return 'block text-sm font-medium text-gray-700 mb-1'
}

export function VenueForm({ venueId, initialData }: VenueFormProps) {
  const router = useRouter()
  const isEditing = venueId !== undefined

  const [name, setName] = useState(initialData?.name ?? '')
  const [sleeps, setSleeps] = useState(initialData?.sleeps ?? '')
  const [mode, setMode] = useState<'search' | 'manual'>('search')

  // Search path state
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Manual path state
  const [manualAddress, setManualAddress] = useState(initialData?.address ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'search' || query.length < 2) {
      setSuggestions([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`)
        const data = await res.json() as PlaceSuggestion[]
        setSuggestions(Array.isArray(data) ? data : [])
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [query, mode])

  function selectPlace(p: PlaceSuggestion) {
    setSelectedPlace({
      address: p.formattedAddress ?? '',
      locality: p.locality,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      googleMapsUrl: p.googleMapsUrl,
    })
    setQuery('')
    setSuggestions([])
  }

  function clearPlace() {
    setSelectedPlace(null)
    setQuery('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }

    setLoading(true)
    setError(null)

    const payload =
      mode === 'search' && selectedPlace
        ? {
            name: name.trim(),
            address: selectedPlace.address,
            locality: selectedPlace.locality,
            country: selectedPlace.country,
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
            googleMapsUrl: selectedPlace.googleMapsUrl,
            sleeps: sleeps ? parseInt(sleeps) : null,
          }
        : {
            name: name.trim(),
            address: manualAddress.trim() || null,
            sleeps: sleeps ? parseInt(sleeps) : null,
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
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass()}
          placeholder="Chateau Example"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass().replace(' mb-1', '')}>Location</label>
          <button
            type="button"
            onClick={() => { setMode(mode === 'search' ? 'manual' : 'search'); setSelectedPlace(null); setQuery('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            {mode === 'search' ? 'Enter manually instead' : 'Search Google Places instead'}
          </button>
        </div>

        {mode === 'search' ? (
          selectedPlace ? (
            <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm">
              <span className="text-green-800">
                {selectedPlace.address}
              </span>
              <button type="button" onClick={clearPlace} className="ml-3 text-green-600 hover:text-green-800 flex-shrink-0">
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={inputClass()}
                placeholder="Search for a place…"
                autoComplete="off"
              />
              {searching && (
                <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching…</div>
              )}
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.placeId}>
                      <button
                        type="button"
                        onClick={() => selectPlace(s)}
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <div className="text-sm font-medium text-gray-900">{s.displayName}</div>
                        {s.formattedAddress && (
                          <div className="text-xs text-gray-500 truncate">{s.formattedAddress}</div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        ) : (
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            className={inputClass()}
            placeholder="Via dei Palazzi, 5, Montepulciano, Italy"
          />
        )}
      </div>

      <div>
        <label className={labelClass()}>Sleeps</label>
        <input
          type="number"
          min="0"
          value={sleeps}
          onChange={(e) => setSleeps(e.target.value)}
          className={inputClass()}
          placeholder="90"
        />
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
