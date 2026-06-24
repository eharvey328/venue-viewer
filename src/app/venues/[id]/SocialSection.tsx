'use client';

import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAction } from 'next-safe-action/hooks';
import { updateInstagram } from '@/app/actions';
import { SectionHeader } from './SectionHeader';
import { InstagramEmbed } from './InstagramEmbed';

export function SocialSection({
  instagramUrl,
  venueId,
  managing,
  onEdit,
}: {
  instagramUrl: string;
  venueId: number;
  managing: boolean;
  onEdit: () => void;
}) {
  const queryClient = useQueryClient();

  const { execute: execDelete, isPending: deleting } = useAction(updateInstagram, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venue', venueId] }),
  });

  return (
    <div className="relative">
      <SectionHeader label="Social" />
      <div className="relative">
        <div className="[&_h2]:hidden [&_.mt-6]:mt-0">
          <InstagramEmbed instagramUrl={instagramUrl} />
        </div>
        {managing && (
          <div
            onClick={onEdit}
            className="absolute inset-0 cursor-pointer"
          />
        )}
      </div>

      {managing && (
        <button
          onClick={(e) => { e.stopPropagation(); execDelete({ venueId, instagramUrl: null }); }}
          disabled={deleting}
          aria-label="Remove Instagram"
          className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
