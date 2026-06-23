'use client';

import { useEffect } from 'react';


interface InstagramEmbedProps {
  instagramUrl: string;
}

export function InstagramEmbed({ instagramUrl }: InstagramEmbedProps) {
  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, []);

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-gray-700">Instagram</h2>
      <div className="relative flex">
        <blockquote
          className="instagram-media bg-white mb-3 flex-1 p-0 rounded-[3px] border border-solid border-[#dbdbdb]"
          data-instgrm-permalink={instagramUrl}
          data-instgrm-version="14"
        >
          {/* Profile header skeleton */}
          <div className="flex items-center gap-6 p-6">
            <div className="h-22 w-22 shrink-0 animate-pulse rounded-full bg-gray-200" />
            <div className="flex flex-col gap-3 min-h-[109px]">
              <div className="h-3.5 w-40 leading-5 animate-pulse rounded bg-gray-200 mt-[5px]" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
          {/* Post grid skeleton */}
          <div className="grid grid-cols-3 gap-px ">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-gray-200" />
            ))}
          </div>
          {/* View profile button skeleton */}
          <div className="h-16" />
        </blockquote>
      </div>
    </div>
  );
}
