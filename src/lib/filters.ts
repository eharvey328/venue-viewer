import { z } from 'zod';

export const KNOWN_COUNTRIES = ['France', 'Italy', 'Belgium', 'Portugal'] as const;

export const filtersSchema = z.object({
  country: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v ? [v] : []))
    .pipe(z.array(z.enum(KNOWN_COUNTRIES)))
    .default([]),
  sleepsMin: z.coerce.number().int().positive().nullable().default(null),
  sort: z.enum(['name_asc', 'name_desc', 'sleeps_asc', 'sleeps_desc']).default('name_asc'),
  view: z.enum(['list', 'map']).default('list'),
});

export type VenueFilters = z.infer<typeof filtersSchema>;
export type SortOption = VenueFilters['sort'];
export type ViewOption = VenueFilters['view'];

export function parseFilters(params: URLSearchParams): VenueFilters {
  const paramsObj = searchParamsToObject(params);
  const parsed = filtersSchema.safeParse(paramsObj);
  return parsed.success ? parsed.data : filtersSchema.parse({});
}

function searchParamsToObject(params: URLSearchParams) {
  const obj: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    obj[key] = values.length === 1 ? values[0] : values;
  }
  return obj;
}

export function serializeFilters(filters: VenueFilters): string {
  const params = new URLSearchParams();
  filters.country.forEach((c) => params.append('country', c));
  if (filters.sleepsMin !== null) params.set('sleepsMin', String(filters.sleepsMin));
  if (filters.sort !== 'name_asc') params.set('sort', filters.sort);
  if (filters.view !== 'list') params.set('view', filters.view);
  return params.toString();
}
