import { getVenues } from '@/lib/venues';
import { filtersSchema } from '@/lib/filters';
import { ScrollRestore } from '@/app/_home/ScrollRestore';
import { FilterBar } from './_home/FilterBar';
import { VenueList } from './_home/VenueList';
import { VenueMapDynamic } from './_home/VenueMapDynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const parsed = filtersSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : filtersSchema.parse({});
  const venues = await getVenues(filters);

  return (
    <div className="space-y-4">
      <FilterBar filters={filters} totalCount={venues.length} />
      {filters.view === 'map' ? <VenueMapDynamic venues={venues} /> : <VenueList venues={venues} />}
      <ScrollRestore />
    </div>
  );
}
