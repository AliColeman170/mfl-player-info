'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PlayersApiFilters } from '../types';

export interface FilterCounts {
  nationalities?: Record<string, number>;
  primaryPositions?: Record<string, number>;
  secondaryPositions?: Record<string, number>;
  owners?: Record<string, number>;
  clubs?: Record<string, number>;
  bestPositions?: Record<string, number>;
  preferredFoot?: Record<string, number>;
  favourites?: Record<string, number>;
  tags?: Record<string, number>;
}

async function fetchFilterCounts(
  filters: PlayersApiFilters,
  authenticatedWalletAddress?: string
): Promise<FilterCounts> {
  const supabase = createClient();

  // Get authenticated user's wallet address from auth metadata if available
  const { data: { user } } = await supabase.auth.getUser();
  const userWalletAddress = user?.app_metadata?.address || authenticatedWalletAddress;

  const { data, error } = await supabase.rpc('get_filter_counts', {
    // Search filters
    search_text: filters.search || undefined,
    favourites_filter: filters.favourites || 'all',
    selected_tags: filters.tags || [],
    tags_match_all: filters.tagsMatchAll || false,
    authenticated_wallet_address: userWalletAddress || undefined,
    wallet_address_filter: filters.walletAddress || undefined,

    // Multi-select filters (apply current selections)
    applied_nationalities: filters.nationalities || [],
    applied_positions: filters.positions || [],
    applied_secondary_positions: filters.secondaryPositions || [],
    applied_owners: filters.owners || [],
    applied_clubs: filters.clubs || [],
    applied_best_positions: filters.bestPositions || [],
    applied_preferred_foot: filters.preferredFoot || undefined,

    // Range filters
    age_min_filter: filters.ageMin || undefined,
    age_max_filter: filters.ageMax || undefined,
    height_min_filter: filters.heightMin || undefined,
    height_max_filter: filters.heightMax || undefined,
    overall_min_filter: filters.overallMin || undefined,
    overall_max_filter: filters.overallMax || undefined,
    pace_min_filter: filters.paceMin || undefined,
    pace_max_filter: filters.paceMax || undefined,
    shooting_min_filter: filters.shootingMin || undefined,
    shooting_max_filter: filters.shootingMax || undefined,
    passing_min_filter: filters.passingMin || undefined,
    passing_max_filter: filters.passingMax || undefined,
    dribbling_min_filter: filters.dribblingMin || undefined,
    dribbling_max_filter: filters.dribblingMax || undefined,
    defense_min_filter: filters.defenseMin || undefined,
    defense_max_filter: filters.defenseMax || undefined,
    physical_min_filter: filters.physicalMin || undefined,
    physical_max_filter: filters.physicalMax || undefined,
    best_overall_min_filter: filters.bestOverallMin || undefined,
    best_overall_max_filter: filters.bestOverallMax || undefined,
    market_value_min_filter: filters.marketValueMin || undefined,
    market_value_max_filter: filters.marketValueMax || undefined,
    price_diff_min_filter: filters.priceDiffMin || undefined,
    price_diff_max_filter: filters.priceDiffMax || undefined,
  });

  console.log({ data, error });

  if (error) {
    throw new Error(`Failed to fetch filter counts: ${error.message}`);
  }

  return data as FilterCounts;
}

export function useFilterCounts(
  filters: PlayersApiFilters,
  authenticatedWalletAddress?: string
) {
  return useQuery({
    queryKey: ['filter-counts', filters, authenticatedWalletAddress],
    queryFn: () => fetchFilterCounts(filters, authenticatedWalletAddress),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
    // Always enabled to show all available filter counts
    enabled: true,
  });
}
