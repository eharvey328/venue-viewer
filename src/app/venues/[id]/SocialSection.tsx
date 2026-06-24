import { SectionHeader } from './SectionHeader';
import { InstagramEmbed } from './InstagramEmbed';

export function SocialSection({ instagramUrl }: { instagramUrl: string }) {
  return (
    <div>
      <SectionHeader label="Social" />
      <InstagramEmbed instagramUrl={instagramUrl} />
    </div>
  );
}
