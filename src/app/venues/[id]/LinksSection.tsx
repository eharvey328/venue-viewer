import { SectionHeader } from './SectionHeader';
import { WebsiteCard } from './WebsiteCard';

interface VenueLink {
  id: number;
  url: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
}

export function LinksSection({
  links,
  venueId,
  managing,
  onEdit,
}: {
  links: VenueLink[];
  venueId: number;
  managing: boolean;
  onEdit: (link: VenueLink) => void;
}) {
  if (links.length === 0) return null;

  return (
    <div>
      <SectionHeader label="Links" />
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <WebsiteCard
            key={link.id}
            link={link}
            venueId={venueId}
            managing={managing}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}
