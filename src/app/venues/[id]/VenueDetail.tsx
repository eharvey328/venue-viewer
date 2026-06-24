'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { DeleteButton } from './DeleteButton';
import { LinksSection } from './LinksSection';
import { SocialSection } from './SocialSection';

interface Venue {
  id: number;
  name: string;
  address: string | null;
  sleeps: number | null;
  photoUrl: string | null;
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  instagramUrl: string | null;
}

export function VenueDetail({ id }: { id: number }) {
  const router = useRouter();
  const { data: venue, isLoading } = useQuery<Venue>({
    queryKey: ['venue', id],
    queryFn: async () => {
      const res = await fetch(`/api/venues/${id}`);
      if (res.status === 404) {
        router.replace('/not-found');
        return null as unknown as Venue;
      }
      return res.json();
    },
  });

  if (isLoading || !venue) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back
      </Link>

      {venue.photoUrl && (
        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={venue.photoUrl}
            alt={venue.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 512px"
            priority
          />
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{venue.name}</h1>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/venues/${venue.id}/edit`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
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

      <div className="mt-6">
        <Button variant="outline" className="w-full" disabled>
          + Add Media
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <LinksSection
          websiteUrl={venue.websiteUrl}
          googleMapsUrl={venue.googleMapsUrl}
          address={venue.address}
        />
        {venue.instagramUrl && <SocialSection instagramUrl={venue.instagramUrl} />}
      </div>
    </div>
  );
}
