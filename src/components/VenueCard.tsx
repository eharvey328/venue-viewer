import Link from 'next/link'

interface VenueCardProps {
  id: number
  name: string
  locality: string | null
  country: string | null
  sleeps: number | null
}

export function VenueCard({ id, name, locality, country, sleeps }: VenueCardProps) {
  const location = [locality, country].filter(Boolean).join(', ')
  return (
    <Link
      href={`/venues/${id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:shadow-none transition-shadow"
    >
      <h2 className="text-base font-semibold text-gray-900 leading-snug">{name}</h2>
      {location && (
        <p className="mt-1 text-sm text-gray-500 truncate">{location}</p>
      )}
      {sleeps != null && (
        <span className="mt-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Sleeps {sleeps}
        </span>
      )}
    </Link>
  )
}
