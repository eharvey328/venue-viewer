import { VenueCard } from './VenueCard';

interface Venue {
  id: number;
  name: string;
  locality: string | null;
  country: string | null;
  sleeps: number | null;
  photoUrl: string | null;
}

export function VenueList({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-lg font-medium">No venues match these filters</p>
        <p className="mt-1 text-sm">Try adjusting or clearing filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((v) => (
        <VenueCard key={v.id} {...v} />
      ))}
    </div>
  );
}
