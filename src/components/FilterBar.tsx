'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { xor } from 'lodash-es';
import {
  KNOWN_COUNTRIES,
  serializeFiltersToParams,
  type VenueFilters,
  type SortOption,
  type ViewOption,
} from '@/lib/filters';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'sleeps_asc', label: 'Sleeps ↑' },
  { value: 'sleeps_desc', label: 'Sleeps ↓' },
];

interface FilterBarProps {
  filters: VenueFilters;
  totalCount: number;
}

export function FilterBar({ filters, totalCount }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (updates: Partial<VenueFilters>) => {
      const next = { ...filters, ...updates };
      const qs = serializeFiltersToParams(next);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname, router]
  );

  function toggleCountry(country: string) {
    update({ countries: xor(filters.countries, [country]) });
  }

  function setView(view: ViewOption) {
    update({ view });
  }

  const hasFilters = filters.countries.length > 0 || filters.sleepsMin !== null;

  return (
    <div className="space-y-3">
      {/* View tab toggle */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 w-fit">
        {(['list', 'map'] as ViewOption[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filters.view === v
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v === 'list' ? '☰ List' : '🗺 Map'}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {KNOWN_COUNTRIES.map((c) => (
          <button
            key={c}
            onClick={() => toggleCountry(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filters.countries.includes(c)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}

        <input
          type="number"
          min={0}
          placeholder="Min sleeps"
          value={filters.sleepsMin ?? ''}
          onChange={(e) => update({ sleepsMin: e.target.value ? parseInt(e.target.value) : null })}
          className="w-28 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {filters.view === 'list' && (
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as SortOption })}
            className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        <span className="ml-auto text-sm text-gray-400">
          {totalCount} venue{totalCount !== 1 ? 's' : ''}
        </span>
        {hasFilters && (
          <button
            onClick={() =>
              router.push(pathname + (filters.view !== 'list' ? `?view=${filters.view}` : ''))
            }
            className="text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
