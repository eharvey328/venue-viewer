export type ActionState = { error: string } | null;

export type SaveVenueInput = {
  venueId?: number;
  name: string;
  address: string;
  sleeps: string;
  instagramUrl: string;
  // Present when the place was resolved via Places search
  placeId?: string;
  locality?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  googleMapsUrl?: string | null;
  websiteUrl?: string | null;
};
