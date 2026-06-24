import { MapPin } from 'lucide-react';

export function GoogleMapsCard({ url, address }: { url: string; address: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 hover:bg-green-100 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white">
        <MapPin size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-green-900">View on Google Maps</p>
        {address && <p className="text-xs text-green-700 truncate">{address}</p>}
      </div>
      <span className="ml-auto text-green-600 text-sm">→</span>
    </a>
  );
}
