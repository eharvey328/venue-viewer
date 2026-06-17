import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVenueById } from '@/lib/venues';
import { DeleteButton } from '@/components/DeleteButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VenueDetailPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const venue = await getVenueById(id);
  if (!venue) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{venue.name}</h1>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/venues/${venue.id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <DeleteButton venueId={venue.id} venueName={venue.name} />
        </div>
      </div>

      {venue.address && <p className="mt-2 text-gray-500">{venue.address}</p>}

      {venue.sleeps != null && (
        <span className="mt-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Sleeps {venue.sleeps}
        </span>
      )}

      {venue.googleMapsUrl && (
        <a
          href={venue.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          View on Google Maps →
        </a>
      )}

      {venue.lat != null && venue.lng != null && (
        <p className="mt-3 text-xs text-gray-400">
          {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
