'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteVenueAction } from '@/app/actions';

export function DeleteButton({ venueId, venueName }: { venueId: number; venueName: string }) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(deleteVenueAction, null);

  async function handleClick() {
    if (!window.confirm(`Delete "${venueName}"? This cannot be undone.`)) return;
    const result = await dispatch(venueId);
    if (result === null) {
      router.push('/');
    }
  }

  return (
    <>
      {state?.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
      <Button variant="destructive" size="sm" onClick={handleClick} disabled={pending}>
        {pending ? 'Deleting…' : 'Delete'}
      </Button>
    </>
  );
}
