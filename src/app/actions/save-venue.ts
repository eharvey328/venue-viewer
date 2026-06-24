'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { createVenue, updateVenue, getVenueById, addVenueLink } from '@/lib/venues';
import { geocode } from '@/lib/geocode';
import { fetchAndUploadPhoto } from '@/lib/photo';
import { fetchOgMetadata } from '@/lib/og';
import { actionClient } from '@/lib/safe-action';

const saveVenueSchema = z.object({
  venueId: z.number().int().positive().optional(),
  name: z.string().min(1, 'Name is required'),
  address: z.string(),
  sleeps: z.string(),
  instagramUrl: z.string().optional(),
  // Present when the place was resolved via Places search
  placeId: z.string().optional(),
  locality: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(), // from Places API only
  photoName: z.string().nullable().optional(),
});

export const saveVenue = actionClient
  .inputSchema(saveVenueSchema)
  .action(async ({ parsedInput }) => {
    const {
      venueId,
      name,
      address: rawAddress,
      sleeps: rawSleeps,
      instagramUrl: rawInstagram,
      placeId,
      photoName,
    } = parsedInput;

    const address = rawAddress.trim() || null;
    const sleeps = rawSleeps ? parseInt(rawSleeps) : null;
    const parsedSleeps = Number.isNaN(sleeps) ? null : sleeps;

    let locality: string | null = null;
    let country: string | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    let googleMapsUrl: string | null = null;
    let googlePlaceId: string | null = null;
    let placesWebsiteUrl: string | null = null; // only used to create a VenueLink on new venue
    let instagramUrl: string | null = null;
    let photoUrl: string | null = null;

    try {
      if (placeId) {
        locality = parsedInput.locality ?? null;
        country = parsedInput.country ?? null;
        lat = parsedInput.lat ?? null;
        lng = parsedInput.lng ?? null;
        googleMapsUrl = parsedInput.googleMapsUrl ?? null;
        googlePlaceId = placeId;
        placesWebsiteUrl = parsedInput.websiteUrl ?? null;
        instagramUrl = rawInstagram?.trim() || null;
        if (photoName) {
          photoUrl = await fetchAndUploadPhoto(photoName, name.trim());
        }
      } else if (venueId) {
        const existing = await getVenueById(venueId);
        const existingAddress = existing?.address?.trim() || null;

        instagramUrl =
          rawInstagram !== undefined
            ? rawInstagram.trim() || null
            : (existing?.instagramUrl ?? null);

        if (address === existingAddress) {
          locality = existing?.locality ?? null;
          country = existing?.country ?? null;
          lat = existing?.lat ?? null;
          lng = existing?.lng ?? null;
          googleMapsUrl = existing?.googleMapsUrl ?? null;
          googlePlaceId = existing?.googlePlaceId ?? null;
          photoUrl = existing?.photoUrl ?? null;
        } else if (address) {
          const coords = await geocode(address);
          locality = coords?.locality ?? null;
          country = coords?.country ?? null;
          lat = coords?.lat ?? null;
          lng = coords?.lng ?? null;
        }
      } else if (address) {
        const coords = await geocode(address);
        locality = coords?.locality ?? null;
        country = coords?.country ?? null;
        lat = coords?.lat ?? null;
        lng = coords?.lng ?? null;
        instagramUrl = rawInstagram?.trim() || null;
      }

      const data = {
        name: name.trim(),
        address,
        locality,
        country,
        lat,
        lng,
        googleMapsUrl,
        googlePlaceId,
        photoUrl,
        sleeps: parsedSleeps,
        instagramUrl,
      };

      const venue = venueId ? await updateVenue(venueId, data) : await createVenue(data);

      // Auto-create a VenueLink for website URL on new venue creation via Places
      if (!venueId && placesWebsiteUrl) {
        const og = await fetchOgMetadata(placesWebsiteUrl);
        await addVenueLink(venue.id, {
          url: placesWebsiteUrl,
          ogTitle: og?.title ?? null,
          ogDescription: og?.description ?? null,
          ogImage: og?.image ?? null,
        });
      }

      redirect(`/venues/${venue.id}`);
    } catch (e) {
      if (isRedirectError(e)) throw e;
      throw e;
    }
  });
