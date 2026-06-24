import { SectionHeader } from './SectionHeader';
import { WebsiteCard } from './WebsiteCard';

export function LinksSection({ websiteUrl }: { websiteUrl: string | null }) {
  if (!websiteUrl) return null;

  return (
    <div>
      <SectionHeader label="Links" />
      <WebsiteCard url={websiteUrl} />
    </div>
  );
}
