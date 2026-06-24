'use server';

import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { deleteVenueLink, addVenueLink } from '@/lib/venues';
import { fetchOgMetadata } from '@/lib/og';

export const updateLink = actionClient
  .inputSchema(
    z.object({
      linkId: z.number().int().positive(),
      venueId: z.number().int().positive(),
      url: z.string().url('Please enter a valid URL'),
    })
  )
  .action(async ({ parsedInput: { linkId, venueId, url } }) => {
    await deleteVenueLink(linkId);
    const og = await fetchOgMetadata(url);
    return addVenueLink(venueId, {
      url,
      ogTitle: og?.title ?? null,
      ogDescription: og?.description ?? null,
      ogImage: og?.image ?? null,
    });
  });
