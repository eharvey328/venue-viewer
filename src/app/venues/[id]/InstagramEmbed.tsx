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

    // Watch for Instagram replacing the blockquote with an iframe.
    // If no iframe appears within 8s, or the iframe src signals an error, show fallback.
    const container = containerRef.current;
    if (!container) return;

    let timer: ReturnType<typeof setTimeout>;

    const observer = new MutationObserver(() => {
      const iframe = container.querySelector('iframe');
      if (!iframe) return;
      observer.disconnect();
      clearTimeout(timer);

      // Instagram error pages have a recognisable src pattern
      const checkSrc = () => {
        const src = iframe.src ?? '';
        if (src.includes('/embed/captcha') || src.includes('error') || src === '') {
          setFailed(true);
        }
      };

      if (iframe.src) {
        checkSrc();
      } else {
        iframe.addEventListener('load', checkSrc, { once: true });
      }

      // Also check iframe height after it loads — error embeds stay very short
      iframe.addEventListener(
        'load',
        () => {
          // Give the iframe a moment to paint
          setTimeout(() => {
            if (iframe.offsetHeight < 100) setFailed(true);
          }, 500);
        },
        { once: true },
      );
    });

    observer.observe(container, { childList: true, subtree: true });

    // Fallback: if Instagram's script never fires (blocked, slow, etc.)
    timer = setTimeout(() => {
      observer.disconnect();
      const iframe = container.querySelector('iframe');
      if (!iframe) setFailed(true);
    }, 8000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
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
