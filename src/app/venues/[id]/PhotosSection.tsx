'use client';

import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAction } from 'next-safe-action/hooks';
import { deletePhoto } from '@/app/actions';
import { SectionHeader } from './SectionHeader';

interface VenuePhoto {
  id: number;
  url: string;
  caption: string | null;
}

const MAX_VISIBLE = 6;

export function PhotosSection({
  photos,
  venueId,
  managing,
  onPhotoClick,
}: {
  photos: VenuePhoto[];
  venueId: number;
  managing: boolean;
  onPhotoClick: (index: number) => void;
}) {
  const queryClient = useQueryClient();
  const { execute: execDelete } = useAction(deletePhoto, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venue', venueId] }),
  });

  if (photos.length === 0) return null;

  const visible = photos.slice(0, MAX_VISIBLE);
  const overflow = photos.length - MAX_VISIBLE;

  return (
    <div className="mt-6">
      <SectionHeader label="Photos" />
      <div className="grid grid-cols-2 gap-1">
        {visible.map((photo, i) => {
          const isLast = i === visible.length - 1;
          const showOverlay = isLast && overflow > 0;

          return (
            <div
              key={photo.id}
              className="relative cursor-pointer"
              onClick={() => onPhotoClick(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? ''}
                className="aspect-square w-full object-cover rounded-sm"
              />
              {showOverlay && (
                <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-black/50">
                  <span className="text-white font-semibold text-lg">+{overflow}</span>
                </div>
              )}
              {managing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    execDelete({ photoId: photo.id, url: photo.url });
                  }}
                  aria-label="Delete photo"
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-red-600 transition-colors z-10"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
