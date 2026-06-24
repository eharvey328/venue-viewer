import { prisma } from './db';

export async function getVenues() {
  return prisma.venue.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      address: true,
      locality: true,
      country: true,
      lat: true,
      lng: true,
      sleeps: true,
      googleMapsUrl: true,
      photoUrl: true,
    },
  });
}

export async function getVenueById(id: number) {
  return prisma.venue.findUnique({
    where: { id },
    include: { links: { orderBy: { createdAt: 'asc' } } },
  });
}

export async function addVenueLink(
  venueId: number,
  data: {
    url: string;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
  }
) {
  return prisma.venueLink.create({ data: { venueId, ...data } });
}

export async function deleteVenueLink(id: number) {
  return prisma.venueLink.delete({ where: { id } });
}

export async function createVenue(data: {
  name: string;
  address?: string | null;
  locality?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  sleeps?: number | null;
  googleMapsUrl?: string | null;
  instagramUrl?: string | null;
  googlePlaceId?: string | null;
  photoUrl?: string | null;
}) {
  return prisma.venue.create({ data });
}

export async function updateVenue(
  id: number,
  data: {
    name?: string;
    address?: string | null;
    locality?: string | null;
    country?: string | null;
    lat?: number | null;
    lng?: number | null;
    sleeps?: number | null;
    googleMapsUrl?: string | null;
    instagramUrl?: string | null;
    googlePlaceId?: string | null;
    photoUrl?: string | null;
  }
) {
  return prisma.venue.update({ where: { id }, data });
}

export async function deleteVenue(id: number) {
  return prisma.venue.delete({ where: { id } });
}
