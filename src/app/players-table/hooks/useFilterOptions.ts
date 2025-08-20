'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface FilterOptions {
  nationalities?: string[];
  owners?: string[];
  clubs?: string[];
  tags?: string[];
  primaryPositions?: string[];
  secondaryPositions?: string[];
  bestPositions?: string[];
  preferredFoot?: string[];
}

async function fetchFilterOptions(): Promise<FilterOptions> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_filter_options');

  if (error) {
    throw new Error(`Failed to fetch filter options: ${error.message}`);
  }

  return data as FilterOptions;
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}