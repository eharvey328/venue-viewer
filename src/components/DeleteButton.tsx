'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    <button
      onClick={handleDelete}
      disabled={loading}
      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
}
