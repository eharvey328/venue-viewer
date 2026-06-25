'use server';

import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { addVenuePhoto } from '@/lib/venues';

export const addPhoto = actionClient
  .inputSchema(
    z.object({
      venueId: z.number().int().positive(),
      url: z.string().url(),
      caption: z.string().optional(),
    })
  )
  .action(async ({ parsedInput: { venueId, url, caption } }) => {
    return addVenuePhoto(venueId, { url, caption: caption || null });
  });
