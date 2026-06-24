import { notFound } from 'next/navigation';
import { VenueDetail } from './VenueDetail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VenueDetailPage({ params }: Props) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) notFound();
  return <VenueDetail id={id} />;
}
