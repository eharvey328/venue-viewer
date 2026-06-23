'use client';

import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { Button } from '@/components/ui/button';
import { deleteVenueAction } from '@/app/actions';

export function DeleteButton({ venueId, venueName }: { venueId: number; venueName: string }) {
  const router = useRouter();
  const { execute, isPending, result } = useAction(deleteVenueAction, {
    onSuccess: () => router.push('/'),
  });

  return (
    <>
      {result.serverError && <p className="mt-1 text-xs text-destructive">{result.serverError}</p>}
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Delete "${venueName}"? This cannot be undone.`)) return;
          execute({ venueId });
        }}
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </Button>
    </>
  );
}
