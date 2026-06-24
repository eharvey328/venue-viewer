'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, BedSingle, ExternalLink } from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
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

export function VenueDetail({ id, initialVenue }: { id: number; initialVenue: Venue }) {
  const router = useRouter();
  const { data: venue } = useQuery<Venue>({
    queryKey: ['venue', id],
    queryFn: async () => {
      const res = await fetch(`/api/venues/${id}`);
      if (res.status === 404) {
        router.replace('/not-found');
        return null as unknown as Venue;
      }
      return res.json();
    },
    initialData: initialVenue,
  });

  if (!venue) {
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
        <Link
          href={`/venues/${venue.id}/edit`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Edit
        </Link>
      </div>

      {(venue.address || venue.sleeps != null) && (
        <div className="mt-3 flex flex-col gap-1.5">
          {venue.address &&
            (venue.googleMapsUrl ? (
              <a
                href={venue.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
              >
                <MapPin size={14} className="shrink-0" />
                {venue.address}
                <ExternalLink size={12} className="shrink-0 ml-0.5" />
              </a>
            ) : (
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} className="shrink-0" />
                {venue.address}
              </span>
            ))}
          {venue.sleeps != null && (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <BedSingle size={14} className="shrink-0" />
              Sleeps {venue.sleeps}
            </span>
          )}
        </div>
      )}

      <div className="mt-6">
        <Button variant="outline" className="w-full" disabled>
          + Add Media
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <LinksSection websiteUrl={venue.websiteUrl} />
        {venue.instagramUrl && <SocialSection instagramUrl={venue.instagramUrl} />}
      </div>
    </div>
  );
}
