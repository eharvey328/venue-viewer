import { SectionHeader } from './SectionHeader';
import { InstagramEmbed } from './InstagramEmbed';

export function SocialSection({ instagramUrl }: { instagramUrl: string }) {
  return (
    <div>
      <SectionHeader label="Social" />
      <div className="[&_h2]:hidden [&_.mt-6]:mt-0">
        <InstagramEmbed instagramUrl={instagramUrl} />
      </div>
    </div>
  );
}
