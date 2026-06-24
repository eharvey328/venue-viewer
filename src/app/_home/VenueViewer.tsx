'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { parseFilters } from '@/lib/filters';
import { FilterBar } from './FilterBar';
import { VenueList } from './VenueList';

const VenueMap = dynamic(() => import('./VenueMap'), { ssr: false });

type Venue = {
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
};

function applyFilters(venues: Venue[], filters: ReturnType<typeof parseFilters>): Venue[] {
  let result = venues;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter((v) => v.name.toLowerCase().includes(q));
  }

  if (filters.country.length > 0) {
    result = result.filter((v) =>
      filters.country.some((c) => v.country?.toLowerCase().includes(c.toLowerCase()))
    );
  }

  if (filters.sleepsMin !== null) {
    result = result.filter((v) => v.sleeps != null && v.sleeps >= filters.sleepsMin!);
  }

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'sleeps_asc':
        return (a.sleeps ?? Infinity) - (b.sleeps ?? Infinity);
      case 'sleeps_desc':
        return (b.sleeps ?? -Infinity) - (a.sleeps ?? -Infinity);
    }
  });

  return result;
}

export function VenueViewer() {
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);

  const { data: allVenues = [], isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const res = await fetch('/api/venues');
      return res.json();
    },
  });

  const venues = applyFilters(allVenues, filters);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} totalCount={venues.length} />
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        </div>
      ) : filters.view === 'map' ? (
        <VenueMap venues={venues} />
      ) : (
        <VenueList venues={venues} />
      )}
    </div>
  );
}
