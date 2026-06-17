'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function DeleteButton({ venueId, venueName }: { venueId: number; venueName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${venueName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      router.push('/');
      router.refresh();
    } catch {
      alert('Failed to delete. Please try again.');
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting…' : 'Delete'}
    </Button>
  );
}
