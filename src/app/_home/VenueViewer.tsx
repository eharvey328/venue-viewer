'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { parseFilters, serializeFilters } from '@/lib/filters';
import { FilterBar } from './FilterBar';
import { VenueList } from './VenueList';

const VenueMap = dynamic(() => import('./VenueMap'), { ssr: false });

export function VenueViewer() {
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['venues', serializeFilters(filters)],
    queryFn: async () => {
      const qs = serializeFilters(filters);
      const res = await fetch(`/api/venues?${qs}`);
      return res.json();
    },
  });

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
