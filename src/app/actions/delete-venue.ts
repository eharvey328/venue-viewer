'use server';

import { z } from 'zod';
import { deleteVenue } from '@/lib/venues';
import { actionClient } from '@/lib/safe-action';

export const deleteVenueAction = actionClient
  .inputSchema(z.object({ venueId: z.number().int().positive() }))
  .action(async ({ parsedInput: { venueId } }) => {
    await deleteVenue(venueId);
  });
