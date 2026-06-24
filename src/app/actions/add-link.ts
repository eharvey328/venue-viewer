'use server';

import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { addVenueLink } from '@/lib/venues';
import { fetchOgMetadata } from '@/lib/og';

const addLinkSchema = z.object({
  venueId: z.number().int().positive(),
  url: z.string().url('Please enter a valid URL'),
});

export const addLink = actionClient.inputSchema(addLinkSchema).action(async ({ parsedInput }) => {
  const { venueId, url } = parsedInput;
  const og = await fetchOgMetadata(url);
  return addVenueLink(venueId, {
    url,
    ogTitle: og?.title ?? null,
    ogDescription: og?.description ?? null,
    ogImage: og?.image ?? null,
  });
});
