export const KNOWN_COUNTRIES = ['France', 'Italy', 'Belgium', 'Portugal'] as const

export type SortOption = 'name_asc' | 'name_desc' | 'sleeps_asc' | 'sleeps_desc'
export type ViewOption = 'list' | 'map'

export interface VenueFilters {
  countries: string[]
  sleepsMin: number | null
  sort: SortOption
  view: ViewOption
}

export const DEFAULT_FILTERS: VenueFilters = {
  countries: [],
  sleepsMin: null,
  sort: 'name_asc',
  view: 'list',
}

export function parseFiltersFromParams(params: URLSearchParams): VenueFilters {
  const countries = params.getAll('country').filter(Boolean)
  const sleepsMinRaw = params.get('sleepsMin')
  const sleepsMin =
    sleepsMinRaw !== null && !isNaN(parseInt(sleepsMinRaw))
      ? parseInt(sleepsMinRaw)
      : null
  const sort = (params.get('sort') ?? 'name_asc') as SortOption
  const view = (params.get('view') ?? 'list') as ViewOption
  return { countries, sleepsMin, sort, view }
}

export function serializeFiltersToParams(filters: VenueFilters): string {
  const params = new URLSearchParams()
  filters.countries.forEach((c) => params.append('country', c))
  if (filters.sleepsMin !== null) params.set('sleepsMin', String(filters.sleepsMin))
  if (filters.sort !== 'name_asc') params.set('sort', filters.sort)
  if (filters.view !== 'list') params.set('view', filters.view)
  return params.toString()
}
