import { InstagramEmbed } from './InstagramEmbed';

export function SocialSection({ instagramUrl }: { instagramUrl: string }) {
  return <InstagramEmbed instagramUrl={instagramUrl} />;
}
