import { SectionHeader } from './SectionHeader';
import { WebsiteCard } from './WebsiteCard';
import { GoogleMapsCard } from './GoogleMapsCard';

interface Props {
  websiteUrl: string | null;
  googleMapsUrl: string | null;
  address: string | null;
}

export function LinksSection({ websiteUrl, googleMapsUrl, address }: Props) {
  if (!websiteUrl && !googleMapsUrl) return null;

  return (
    <div>
      <SectionHeader label="Links" />
      <div className="flex flex-col gap-2">
        {websiteUrl && <WebsiteCard url={websiteUrl} />}
        {googleMapsUrl && <GoogleMapsCard url={googleMapsUrl} address={address} />}
      </div>
    </div>
  );
}
