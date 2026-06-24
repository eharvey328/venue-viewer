'use client';

import { Globe, ExternalLink, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAction } from 'next-safe-action/hooks';
import { deleteLink } from '@/app/actions';

interface VenueLink {
  id: number;
  url: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

export function WebsiteCard({
  link,
  venueId,
  managing,
  onEdit,
}: {
  link: VenueLink;
  venueId: number;
  managing: boolean;
  onEdit: (link: VenueLink) => void;
}) {
  const { url, ogTitle, ogDescription, ogImage } = link;
  const queryClient = useQueryClient();

  const { execute: execDelete, isPending: deleting } = useAction(deleteLink, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venue', venueId] }),
  });

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url;
  }

  const isRich = ogTitle || ogImage;

  return (
    <div className="relative">
      <a
        href={managing ? undefined : url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={
          managing
            ? (e) => {
                e.preventDefault();
                onEdit(link);
              }
            : undefined
        }
        className={[
          'flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors',
          managing ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200' : 'hover:bg-gray-50',
        ].join(' ')}
      >
        {isRich && ogImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ogImage}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover bg-gray-100"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <Globe size={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {isRich && ogTitle ? (
            <>
              <p className="text-sm font-medium text-gray-900 truncate">{ogTitle}</p>
              {ogDescription && (
                <p className="text-xs text-gray-500 line-clamp-2">{ogDescription}</p>
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
        {!managing && <ExternalLink size={14} className="ml-auto text-gray-400 shrink-0" />}
      </a>

      {managing && (
        <button
          onClick={() => execDelete({ linkId: link.id })}
          disabled={deleting}
          aria-label="Delete link"
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
