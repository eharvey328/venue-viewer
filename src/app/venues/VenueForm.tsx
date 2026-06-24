'use client';

import { useState, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { debounce } from 'lodash-es';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveVenue } from '@/app/actions';

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
  photoName: string | null;
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
  photoName: string | null;
}

interface VenueFormProps {
  venueId?: number;
  initialData?: {
    name?: string;
    address?: string;
    sleeps?: string;
  };
  deleteButton?: ReactNode;
}

export function VenueForm({ venueId, initialData, deleteButton }: VenueFormProps) {
  const router = useRouter();
  const isEditing = venueId !== undefined;

  const [mode, setMode] = useState<'search' | 'manual'>(initialData ? 'manual' : 'search');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const { execute, isPending, result } = useAction(saveVenue);

  const serverError = result.serverError ?? result.validationErrors?.name?._errors?.[0] ?? null;
  const errorMessage = localError ?? serverError ?? null;

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
      photoName: p.photoName,
    });
    setQuery('');
    setSuggestions([]);
    setLocalError(null);
  }

  function clearPlace() {
    setSelectedPlace(null);
    setQuery('');
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (mode === 'search' && !selectedPlace) {
      setLocalError('Please select a place from the search results');
      return;
    }
    setLocalError(null);

    const form = e.currentTarget;
    const sleeps = (form.elements.namedItem('sleeps') as HTMLInputElement).value;

    if (mode === 'search' && selectedPlace) {
      execute({
        venueId,
        name: selectedPlace.name,
        address: selectedPlace.address,
        sleeps,
        placeId: selectedPlace.placeId,
        locality: selectedPlace.locality,
        country: selectedPlace.country,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        googleMapsUrl: selectedPlace.googleMapsUrl,
        websiteUrl: selectedPlace.websiteUrl,
        photoName: selectedPlace.photoName,
      });
    } else {
      const name = (form.elements.namedItem('manualName') as HTMLInputElement).value;
      const address = (form.elements.namedItem('manualAddress') as HTMLInputElement).value;
      execute({ venueId, name, address, sleeps });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>{mode === 'search' ? 'Place' : 'Name'}</Label>
          <Button
            type="button"
            variant="link"
            size="xs"
            onClick={() => {
              setMode(mode === 'search' ? 'manual' : 'search');
              setSelectedPlace(null);
              setQuery('');
              setSuggestions([]);
              fetchSuggestions.cancel();
              setLocalError(null);
            }}
            className="h-auto p-0 text-xs text-gray-700 cursor-pointer"
          >
            {mode === 'search' ? 'Enter manually instead' : 'Search Google Places instead'}
          </Button>
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
              <Input
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
                className="h-9"
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
            <Input
              name="manualName"
              id="manualName"
              defaultValue={initialData?.name ?? ''}
              className="h-9"
              placeholder="Venue name"
            />
            <div className="space-y-1">
              <Label htmlFor="manualAddress">Address</Label>
              <Input
                name="manualAddress"
                id="manualAddress"
                defaultValue={initialData?.address ?? ''}
                className="h-9"
                placeholder="Via dei Palazzi, 5, Montepulciano, Italy"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="sleeps">Sleeps</Label>
        <Input
          name="sleeps"
          id="sleeps"
          type="number"
          min="0"
          defaultValue={initialData?.sleeps ?? ''}
          className="h-9"
          placeholder="90"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending} size="default">
          {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add venue'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        {deleteButton && <div className="ml-auto">{deleteButton}</div>}
      </div>
    </form>
  );
}
