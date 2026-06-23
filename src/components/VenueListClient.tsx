'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FilterBar } from '@/components/FilterBar';
import { VenueList } from '@/components/VenueList';
import { VenueMapDynamic } from '@/components/VenueMapDynamic';
import { parseFiltersFromParams, serializeFiltersToParams } from '@/lib/filters';

interface Venue {
  id: number;
  name: string;
  address: string | null;
  locality: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  sleeps: number | null;
  googleMapsUrl: string | null;
  photoUrl: string | null;
}

async function fetchVenues(search: string): Promise<Venue[]> {
  const res = await fetch(`/api/venues${search ? `?${search}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch venues');
  const data = (await res.json()) as { venues: Venue[] };
  return data.venues;
}

export function VenueListClient() {
  const searchParams = useSearchParams();
  const filters = parseFiltersFromParams(searchParams);
  const queryKey = serializeFiltersToParams(filters);

  const {
    data: venues,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['venues', queryKey],
    queryFn: () => fetchVenues(queryKey),
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">Failed to load venues</p>
        <p className="mt-1 text-sm">Try refreshing the page</p>
      </div>
    );
  }

  const venueList = venues ?? [];

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} totalCount={isLoading ? 0 : venueList.length} />
      {isLoading ? (
        <div className="py-20 text-center text-gray-400">Loading…</div>
      ) : filters.view === 'map' ? (
        <VenueMapDynamic venues={venueList} />
      ) : (
        <VenueList venues={venueList} />
      )}
    </div>
  );
}
