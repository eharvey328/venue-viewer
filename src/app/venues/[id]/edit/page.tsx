import { notFound } from 'next/navigation'
import { getVenueById } from '@/lib/venues'
import { VenueForm } from '@/components/VenueForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditVenuePage({ params }: Props) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const venue = await getVenueById(id)
  if (!venue) notFound()

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit: {venue.name}</h1>
      <VenueForm
        venueId={venue.id}
        initialData={{
          name: venue.name,
          address: venue.address ?? '',
          lat: venue.lat != null ? String(venue.lat) : '',
          lng: venue.lng != null ? String(venue.lng) : '',
          sleeps: venue.sleeps != null ? String(venue.sleeps) : '',
        }}
      />
    </div>
  )
}
