import { notFound } from 'next/navigation';
import { getVenueById } from '@/lib/venues';
import { VenueDetail } from './VenueDetail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VenueDetailPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();

  const venue = await getVenueById(id);
  if (!venue) notFound();

  return <VenueDetail id={id} initialVenue={venue} />;
}
