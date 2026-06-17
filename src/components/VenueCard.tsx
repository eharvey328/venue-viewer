import Link from 'next/link';
import Image from 'next/image';

interface VenueCardProps {
  id: number;
  name: string;
  locality: string | null;
  country: string | null;
  sleeps: number | null;
  photoUrl: string | null;
}

export function VenueCard({ id, name, locality, country, sleeps, photoUrl }: VenueCardProps) {
  const location = [locality, country].filter(Boolean).join(', ');
  return (
    <Link
      href={`/venues/${id}`}
      className="block rounded-xl border border-gray-200 bg-white shadow-sm active:shadow-none transition-shadow overflow-hidden"
    >
      {photoUrl ? (
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-300 text-3xl">
          🏛
        </div>
      )}
      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-900 leading-snug">{name}</h2>
        {location && <p className="mt-1 text-sm text-gray-500 truncate">{location}</p>}
        {sleeps != null && (
          <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            Sleeps {sleeps}
          </span>
        )}
      </div>
    </Link>
  );
}
