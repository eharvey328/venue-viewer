'use server';

import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { createVenue, updateVenue, getVenueById } from '@/lib/venues';
import { geocode } from '@/lib/geocode';
import type { ActionState, SaveVenueInput } from './types';

export async function saveVenue(
  _prevState: ActionState,
  input: SaveVenueInput
): Promise<ActionState> {
  try {
    const name = input.name.trim();
    if (!name) return { error: 'Name is required' };

    const sleeps = input.sleeps ? parseInt(input.sleeps) : null;
    const parsedSleeps = Number.isNaN(sleeps) ? null : sleeps;
    const instagramUrl = input.instagramUrl.trim() || null;
    const address = input.address.trim() || null;

    let locality: string | null = null;
    let country: string | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    let googleMapsUrl: string | null = null;
    let googlePlaceId: string | null = null;
    let websiteUrl: string | null = null;

    if (input.placeId) {
      // Place resolved via search — use provided geo data directly
      locality = input.locality ?? null;
      country = input.country ?? null;
      lat = input.lat ?? null;
      lng = input.lng ?? null;
      googleMapsUrl = input.googleMapsUrl ?? null;
      googlePlaceId = input.placeId;
      websiteUrl = input.websiteUrl ?? null;
    } else if (input.venueId) {
      // Edit with no new place selected — load existing venue
      const existing = await getVenueById(input.venueId);
      const existingAddress = existing?.address?.trim() || null;

      if (address === existingAddress) {
        // Address unchanged — preserve all existing geo fields
        locality = existing?.locality ?? null;
        country = existing?.country ?? null;
        lat = existing?.lat ?? null;
        lng = existing?.lng ?? null;
        googleMapsUrl = existing?.googleMapsUrl ?? null;
        googlePlaceId = existing?.googlePlaceId ?? null;
        websiteUrl = existing?.websiteUrl ?? null;
      } else if (address) {
        // Address changed — re-geocode, clear place fields
        const coords = await geocode(address);
        locality = coords?.locality ?? null;
        country = coords?.country ?? null;
        lat = coords?.lat ?? null;
        lng = coords?.lng ?? null;
      }
    } else if (address) {
      // New venue, manual entry — geocode
      const coords = await geocode(address);
      locality = coords?.locality ?? null;
      country = coords?.country ?? null;
      lat = coords?.lat ?? null;
      lng = coords?.lng ?? null;
    }

    const data = {
      name,
      address,
      locality,
      country,
      lat,
      lng,
      googleMapsUrl,
      googlePlaceId,
      websiteUrl,
      sleeps: parsedSleeps,
      instagramUrl,
    };

    const venue = input.venueId ? await updateVenue(input.venueId, data) : await createVenue(data);

    redirect(`/venues/${venue.id}`);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error('saveVenue:', e);
    return { error: 'Something went wrong. Please try again.' };
  }
}
