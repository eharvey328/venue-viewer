'use server';

import { z } from 'zod';
import { actionClient } from '@/lib/safe-action';
import { deleteVenueLink } from '@/lib/venues';

const deleteLinkSchema = z.object({
  linkId: z.number().int().positive(),
});

export const deleteLink = actionClient
  .inputSchema(deleteLinkSchema)
  .action(async ({ parsedInput }) => {
    return deleteVenueLink(parsedInput.linkId);
  });
