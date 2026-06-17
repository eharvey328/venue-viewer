interface GoogleMapsEmbedProps {
  googlePlaceId: string;
}

export function GoogleMapsEmbed({ googlePlaceId }: GoogleMapsEmbedProps) {
  const src = `https://maps.google.com/maps?q=place_id:${googlePlaceId}&output=embed`;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-sm font-medium text-gray-700">Location &amp; Photos</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <iframe
          src={src}
          width="100%"
          height="400"
          className="border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        />
      </div>
    </div>
  );
}
