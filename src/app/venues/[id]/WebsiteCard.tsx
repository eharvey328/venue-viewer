import { Globe, ExternalLink } from 'lucide-react';

interface VenueLink {
  id: number;
  url: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

export function WebsiteCard({ link }: { link: VenueLink }) {
  const { url, ogTitle, ogDescription, ogImage } = link;

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    domain = url;
  }

  const isRich = ogTitle || ogImage;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50 transition-colors"
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
      <ExternalLink size={14} className="ml-auto text-gray-400 shrink-0" />
    </a>
  );
}
