'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process(): void;
      };
    };
  }
}

interface InstagramEmbedProps {
  instagramUrl: string;
}

export function InstagramEmbed({ instagramUrl }: InstagramEmbedProps) {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process();
      return;
    }
    const script = document.createElement('script');
    script.src = '//www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-gray-700">Instagram</h2>
      <div className="min-h-[540px]">
        <blockquote
          className="instagram-media w-full m-0"
          data-instgrm-permalink={instagramUrl}
          data-instgrm-version="14"
        />
      </div>
    </div>
  );
}
