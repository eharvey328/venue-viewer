'use client';

import { useEffect, useRef, useState } from 'react';
import { AtSign, ExternalLink } from 'lucide-react';

interface InstagramEmbedProps {
  instagramUrl: string;
}

function extractHandle(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[0] ?? url;
  } catch {
    return url;
  }
}

function ProfileCard({ instagramUrl }: { instagramUrl: string }) {
  const handle = extractHandle(instagramUrl);
  return (
    <a
      href={instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <AtSign size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">@{handle}</p>
        <p className="text-xs text-gray-400">View on Instagram</p>
      </div>
      <ExternalLink size={14} className="text-gray-400 shrink-0" />
    </a>
  );
}

export function InstagramEmbed({ instagramUrl }: InstagramEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);

    window.instgrm?.Embeds.process();

    // Instagram sends multiple MEASURE postMessages as content loads.
    // Track the max height; decide 2s after messages stop arriving.
    // Error pages plateau around 300px; working profile embeds reach 600px+.
    let maxHeight = 0;
    let settleTimer: ReturnType<typeof setTimeout>;
    let timeoutTimer: ReturnType<typeof setTimeout>;

    const decide = () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutTimer);
      if (maxHeight < 480) setFailed(true);
    };

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.type !== 'MEASURE') return;
        const height = data?.details?.height ?? data?.height ?? 0;
        if (height > maxHeight) maxHeight = height;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(decide, 2000);
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);

    // Hard fallback if no MEASURE messages arrive at all
    timeoutTimer = setTimeout(() => {
      clearTimeout(settleTimer);
      window.removeEventListener('message', handleMessage);
      const container = containerRef.current;
      if (!container?.querySelector('iframe')) setFailed(true);
    }, 10000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(settleTimer);
      clearTimeout(timeoutTimer);
    };
  }, [instagramUrl]);

  if (failed) {
    return (
      <div className="mt-6">
        <ProfileCard instagramUrl={instagramUrl} />
      </div>
    );
  }

  return (
    <div className="mt-6" ref={containerRef}>
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
          <div className="grid grid-cols-3 gap-px">
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
