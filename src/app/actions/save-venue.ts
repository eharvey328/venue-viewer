'use server';

import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { createVenue, updateVenue } from '@/lib/venues';
import { geocode } from '@/lib/geocode';
import type { ActionState } from './types';

type SaveVenueInput =
  | {
      kind: 'search';
      venueId?: number;
      placeId: string;
      name: string;
      address: string;
      locality: string | null;
      country: string | null;
      lat: number | null;
      lng: number | null;
      googleMapsUrl: string | null;
      websiteUrl: string | null;
      sleeps: string;
      instagramUrl: string;
    }
  | {
      kind: 'manual';
      venueId?: number;
      name: string;
      address: string;
      sleeps: string;
      instagramUrl: string;
    };

export type { SaveVenueInput };

export async function saveVenue(
  _prevState: ActionState,
  input: SaveVenueInput
): Promise<ActionState> {
  try {
    const sleeps = input.sleeps ? parseInt(input.sleeps) : null;
    const parsedSleeps = Number.isNaN(sleeps) ? null : sleeps;
    const instagramUrl = input.instagramUrl.trim() || null;

    if (input.kind === 'search') {
      const data = {
        name: input.name,
        address: input.address || null,
        locality: input.locality,
        country: input.country,
        lat: input.lat,
        lng: input.lng,
        googleMapsUrl: input.googleMapsUrl,
        websiteUrl: input.websiteUrl,
        googlePlaceId: input.placeId,
        sleeps: parsedSleeps,
        instagramUrl,
      };
      const venue = input.venueId
        ? await updateVenue(input.venueId, data)
        : await createVenue(data);
      redirect(`/venues/${venue.id}`);
    } else {
      const name = input.name.trim();
      if (!name) return { error: 'Name is required' };

      const address = input.address.trim() || null;
      const coords = address ? await geocode(address) : null;

      const data = {
        name,
        address,
        locality: coords?.locality ?? null,
        country: coords?.country ?? null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        googleMapsUrl: null,
        sleeps: parsedSleeps,
        instagramUrl,
      };
      const venue = input.venueId
        ? await updateVenue(input.venueId, data)
        : await createVenue(data);
      redirect(`/venues/${venue.id}`);
    }
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error('saveVenue:', e);
    return { error: 'Something went wrong. Please try again.' };
  }
}
