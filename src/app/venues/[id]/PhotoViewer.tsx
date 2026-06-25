'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogPopup } from '@/components/ui/dialog';

interface VenuePhoto {
  id: number;
  url: string;
  caption: string | null;
}

export function PhotoViewer({
  photos,
  initialIndex,
  open,
  onOpenChange,
}: {
  photos: VenuePhoto[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const prev = () => setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrentIndex((i) => (i + 1) % photos.length);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, photos.length]);

  const photo = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:inset-0 sm:translate-x-0 sm:translate-y-0 sm:max-w-none sm:rounded-none bg-black">
        {photo && (
          <div className="relative flex h-full flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.caption ?? ''}
              className="max-h-[85vh] w-full object-contain"
            />
            {photo.caption && (
              <p className="mt-2 px-4 text-center text-sm text-white/70">{photo.caption}</p>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={next}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>

            {photos.length > 1 && (
              <p className="absolute bottom-4 text-xs text-white/50">
                {currentIndex + 1} / {photos.length}
              </p>
            )}
          </div>
        )}
      </DialogPopup>
    </Dialog>
  );
}
