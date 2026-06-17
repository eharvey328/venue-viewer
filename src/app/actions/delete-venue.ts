'use server';

import { deleteVenue } from '@/lib/venues';
import type { ActionState } from './types';

export async function deleteVenueAction(
  _prevState: ActionState,
  venueId: number
): Promise<ActionState> {
  try {
    await deleteVenue(venueId);
    return null;
  } catch (e) {
    console.error('deleteVenueAction:', e);
    return { error: 'Delete failed. Please try again.' };
  }
}
