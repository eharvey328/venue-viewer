import { Prisma } from '@/generated/prisma/client';
import { prisma } from './db';
import type { SortOption, VenueFilters } from './filters';

function buildOrderBy(sort: SortOption): Prisma.VenueOrderByWithRelationInput {
  switch (sort) {
    case 'name_asc':
      return { name: 'asc' };
    case 'name_desc':
      return { name: 'desc' };
    case 'sleeps_asc':
      return { sleeps: { sort: 'asc', nulls: 'last' } };
    case 'sleeps_desc':
      return { sleeps: { sort: 'desc', nulls: 'last' } };
  }
}

export async function getVenues(filters: VenueFilters) {
  const where: Prisma.VenueWhereInput = {};

  if (filters.country.length > 0) {
    where.OR = filters.country.map((c) => ({
      country: { contains: c, mode: 'insensitive' as const },
    }));
  }

  if (filters.sleepsMin !== null) {
    where.sleeps = { gte: filters.sleepsMin };
  }

  return prisma.venue.findMany({
    where,
    orderBy: buildOrderBy(filters.sort),
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
  return prisma.venue.findUnique({ where: { id } });
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
  websiteUrl?: string | null;
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
    websiteUrl?: string | null;
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
