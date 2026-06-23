import { VenueList } from '@/components/VenueList';
import { FilterBar } from '@/components/FilterBar';
import { VenueMapDynamic } from '@/components/VenueMapDynamic';
import { getVenues } from '@/lib/venues';
import { parseFiltersFromParams } from '@/lib/filters';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const resolved = await searchParams;
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    if (Array.isArray(value)) value.forEach((v) => urlParams.append(key, v));
    else if (value !== undefined) urlParams.set(key, value);
  }

  const filters = parseFiltersFromParams(urlParams);
  const venues = await getVenues(filters);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} totalCount={venues.length} />
      {filters.view === 'map' ? <VenueMapDynamic venues={venues} /> : <VenueList venues={venues} />}
    </div>
  );
}
