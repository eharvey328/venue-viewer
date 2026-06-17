'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { debounce } from 'lodash-es';

interface PlaceSuggestion {
  placeId: string;
  displayName: string | null;
  formattedAddress: string | null;
  locality: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
}

interface PlaceData {
  placeId: string;
  name: string;
  address: string;
  locality: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  googleMapsUrl: string | null;
  websiteUrl: string | null;
}

interface FormValues {
  manualName: string;
  manualAddress: string;
  sleeps: string;
  instagramUrl: string;
}

interface VenueFormProps {
  venueId?: number;
  initialData?: {
    name?: string;
    address?: string;
    sleeps?: string;
    instagramUrl?: string;
  };
}

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';
const ERROR_CLASS = 'mt-1 text-xs text-red-600';

export function VenueForm({ venueId, initialData }: VenueFormProps) {
  const router = useRouter();
  const isEditing = venueId !== undefined;

  const [mode, setMode] = useState<'search' | 'manual'>(initialData ? 'manual' : 'search');

  // Search path state — not form fields, so stays as useState
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      manualName: initialData?.name ?? '',
      manualAddress: initialData?.address ?? '',
      sleeps: initialData?.sleeps ?? '',
      instagramUrl: initialData?.instagramUrl ?? '',
    },
  });

  const fetchSuggestions = useMemo(
    () =>
      debounce(async (q: string) => {
        setSearching(true);
        try {
          const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
          const data = (await res.json()) as PlaceSuggestion[];
          setSuggestions(Array.isArray(data) ? data : []);
        } catch {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, 300),
    []
  );

  function selectPlace(p: PlaceSuggestion) {
    setSelectedPlace({
      placeId: p.placeId,
      name: p.displayName ?? '',
      address: p.formattedAddress ?? '',
      locality: p.locality,
      country: p.country,
      lat: p.lat,
      lng: p.lng,
      googleMapsUrl: p.googleMapsUrl,
      websiteUrl: p.websiteUrl,
    });
    setQuery('');
    setSuggestions([]);
    clearErrors('root');
  }

  function clearPlace() {
    setSelectedPlace(null);
    setQuery('');
  }

  async function onSubmit(values: FormValues) {
    if (mode === 'search' && !selectedPlace) {
      setError('root', { message: 'Please select a place from the search results' });
      return;
    }

    const payload =
      mode === 'search' && selectedPlace
        ? {
            name: selectedPlace.name,
            address: selectedPlace.address,
            locality: selectedPlace.locality,
            country: selectedPlace.country,
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
            googleMapsUrl: selectedPlace.googleMapsUrl,
            websiteUrl: selectedPlace.websiteUrl,
            googlePlaceId: selectedPlace.placeId,
            sleeps: values.sleeps ? parseInt(values.sleeps) : null,
            instagramUrl: values.instagramUrl.trim() || null,
          }
        : {
            name: values.manualName.trim(),
            address: values.manualAddress.trim() || null,
            sleeps: values.sleeps ? parseInt(values.sleeps) : null,
            instagramUrl: values.instagramUrl.trim() || null,
          };

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
        });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError('root', { message: (body as { error?: string }).error ?? 'Request failed' });
      return;
    }

    const venue = (await res.json()) as { id: number };
    router.push(`/venues/${venue.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {errors.root && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.root.message}</div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={LABEL_CLASS.replace(' mb-1', '')}>Place</label>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'search' ? 'manual' : 'search');
              setSelectedPlace(null);
              setQuery('');
              setSuggestions([]);
              fetchSuggestions.cancel();
              clearErrors('root');
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {mode === 'search' ? 'Enter manually instead' : 'Search Google Places instead'}
          </button>
        </div>

        {mode === 'search' ? (
          selectedPlace ? (
            <div className="flex items-start justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-green-900">{selectedPlace.name}</div>
                <div className="text-green-700 text-xs mt-0.5">{selectedPlace.address}</div>
              </div>
              <button
                type="button"
                onClick={clearPlace}
                className="ml-3 text-green-600 hover:text-green-800 shrink-0 mt-0.5"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (val.length < 2) {
                    setSuggestions([]);
                    fetchSuggestions.cancel();
                  } else fetchSuggestions(val);
                }}
                className={INPUT_CLASS}
                placeholder="Search for a venue…"
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
          <div className="space-y-3">
            <div>
              <input
                {...register('manualName', {
                  validate: (v) => (mode === 'manual' ? !!v.trim() || 'Name is required' : true),
                })}
                className={INPUT_CLASS}
                placeholder="Venue name"
              />
              {errors.manualName && <p className={ERROR_CLASS}>{errors.manualName.message}</p>}
            </div>
            <input
              {...register('manualAddress')}
              className={INPUT_CLASS}
              placeholder="Via dei Palazzi, 5, Montepulciano, Italy"
            />
          </div>
        )}
      </div>

      <div>
        <label className={LABEL_CLASS}>Sleeps</label>
        <input
          {...register('sleeps')}
          type="number"
          min="0"
          className={INPUT_CLASS}
          placeholder="90"
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Instagram</label>
        <input
          {...register('instagramUrl')}
          type="url"
          className={INPUT_CLASS}
          placeholder="https://www.instagram.com/venuename"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add venue'}
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
  );
}
