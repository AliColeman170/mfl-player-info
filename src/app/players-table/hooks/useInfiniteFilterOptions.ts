'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

interface FilterOptionsPage {
  items: string[];
  hasMore: boolean;
}

async function fetchFilterOptionsPage(
  optionType: string,
  pageParam: number,
  searchTerm?: string
): Promise<FilterOptionsPage> {
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_filter_options_paginated', {
    option_type: optionType,
    page_size: 50,
    offset_value: pageParam,
    search_term: searchTerm || null,
  });

  if (error) {
    throw new Error(`Failed to fetch ${optionType}: ${error.message}`);
  }

  return data as FilterOptionsPage;
}

export function useInfiniteFilterOptions(optionType: string, searchTerm?: string) {
  return useInfiniteQuery({
    queryKey: ['infinite-filter-options', optionType, searchTerm],
    queryFn: ({ pageParam = 0 }) => fetchFilterOptionsPage(optionType, pageParam, searchTerm),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 50; // 50 items per page
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}