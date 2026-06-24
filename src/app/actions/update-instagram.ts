'use server';

import { z } from 'zod';
import { updateVenue } from '@/lib/venues';
import { actionClient } from '@/lib/safe-action';

export const updateInstagram = actionClient
  .inputSchema(
    z.object({
      venueId: z.number().int().positive(),
      instagramUrl: z.string().url().nullable(),
    })
  )
  .action(async ({ parsedInput: { venueId, instagramUrl } }) => {
    await updateVenue(venueId, { instagramUrl });
  });
