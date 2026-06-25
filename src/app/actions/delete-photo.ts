'use server';

import { z } from 'zod';
import { del } from '@vercel/blob';
import { actionClient } from '@/lib/safe-action';
import { deleteVenuePhoto } from '@/lib/venues';

export const deletePhoto = actionClient
  .inputSchema(
    z.object({
      photoId: z.number().int().positive(),
      url: z.string(),
    })
  )
  .action(async ({ parsedInput: { photoId, url } }) => {
    await del(url);
    return deleteVenuePhoto(photoId);
  });
