'use client';

import { useQuery } from '@tanstack/react-query';
import { Globe, ExternalLink } from 'lucide-react';

interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
}

export function WebsiteCard({ url }: { url: string }) {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url;
  }

  const { data: og, isLoading } = useQuery<OgData | null>({
    queryKey: ['og', url],
    queryFn: async () => {
      const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      return res.json();
    },
    staleTime: Infinity,
  });

  const isRich = og && (og.title || og.image);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {isLoading ? (
        <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-100 animate-pulse" />
      ) : isRich && og.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={og.image}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg object-cover bg-gray-100"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <Globe size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
        ) : isRich && og.title ? (
          <>
            <p className="text-sm font-medium text-gray-900 truncate">{og.title}</p>
            {og.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{og.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">{domain}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-900">{domain}</p>
            <p className="text-xs text-gray-400">Visit website</p>
          </>
        )}
      </div>
      <ExternalLink size={14} className="ml-auto text-gray-400 shrink-0" />
    </a>
  );
}
