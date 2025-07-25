'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PlayerWithFavouriteData, PositionRating } from '@/types/global.types';
import {
  PlayersApiFilters,
  PlayersApiResponse,
} from '@/app/players-table/types';

interface PlayersQueryParams {
  pageSize?: number;
  filters?: PlayersApiFilters;
}

async function fetchPlayersFromDB({
  pageParam,
  pageSize = 50,
  filters = {},
}: {
  pageParam?: string;
  pageSize?: number;
  filters?: PlayersApiFilters;
}): Promise<PlayersApiResponse> {
  const supabase = createClient();

  // Get current user to check favourites
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userWalletAddress = user?.app_metadata?.address;

  // Build the query with favourites join
  let query = supabase
    .from('players')
    .select(
      `
      id,
      first_name,
      last_name,
      age,
      height,
      nationality,
      primary_position,
      secondary_positions,
      preferred_foot,
      overall,
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      goalkeeping,
      best_position,
      best_ovr,
      ovr_difference,
      market_value_estimate,
      market_value_low,
      market_value_high,
      market_value_confidence,
      market_value_method,
      position_ratings,
      position_index,
      best_position_index,
      has_pre_contract,
      energy,
      offer_status,
      contract_id,
      contract_status,
      owner_wallet_address,
      owner_name,
      club_id,
      club_name,
      club_main_color,
      club_secondary_color,
      club_type,
      current_listing_price,
      price_difference,
      last_synced_at,
      favourites (
        is_favourite,
        tags
      )
    `
    )
    .limit(pageSize);

  // Handle favourites filtering
  if (userWalletAddress) {
    if (filters.favourites === 'favourites') {
      // For favourites, get the player IDs that are favourites, then filter the main query
      const { data: favouriteIds } = await supabase
        .from('favourites')
        .select('player_id')
        .eq('wallet_address', userWalletAddress)
        .eq('is_favourite', true);
      
      const includeIds = favouriteIds?.map(f => f.player_id) || [];
      
      if (includeIds.length === 0) {
        // No favourites found, return empty result
        return {
          players: [],
          nextCursor: undefined,
          hasNextPage: false,
        };
      }
      
      // Filter to only include favourite players
      query = query.in('id', includeIds);
      
      // Join with favourites table for UI display
      query = query.eq('favourites.wallet_address', userWalletAddress);
    } else if (filters.favourites === 'non-favourites') {
      // For non-favourites, first get all favourite player IDs, then exclude them
      const { data: favouriteIds } = await supabase
        .from('favourites')
        .select('player_id')
        .eq('wallet_address', userWalletAddress)
        .eq('is_favourite', true);
      
      const excludeIds = favouriteIds?.map(f => f.player_id) || [];
      
      if (excludeIds.length > 0) {
        // Exclude favourite players
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }
      
      // Join with favourites table for UI display (will show false/null for non-favourites)
      query = query.eq('favourites.wallet_address', userWalletAddress);
    } else {
      // Show all players - just join with wallet address to get favourite status
      query = query.eq('favourites.wallet_address', userWalletAddress);
    }
  } else if (filters.favourites === 'favourites' || filters.favourites === 'non-favourites') {
    // User not logged in but trying to filter favourites - return empty results
    return {
      players: [],
      nextCursor: undefined,
      hasNextPage: false,
    };
  }

  // Handle tags filtering (requires user to be logged in)
  if (filters.tags && filters.tags.length > 0 && userWalletAddress) {
    let taggedPlayerIds;
    
    if (filters.tagsMatchAll) {
      // Match ALL selected tags - player must have every selected tag
      const { data } = await supabase
        .from('favourites')
        .select('player_id')
        .eq('wallet_address', userWalletAddress)
        .contains('tags', filters.tags);
      taggedPlayerIds = data;
    } else {
      // Match ANY selected tags - player must have at least one of the selected tags
      const { data } = await supabase
        .from('favourites')
        .select('player_id')
        .eq('wallet_address', userWalletAddress)
        .overlaps('tags', filters.tags);
      taggedPlayerIds = data;
    }

    if (taggedPlayerIds && taggedPlayerIds.length > 0) {
      const playerIds = taggedPlayerIds.map(row => row.player_id);
      query = query.in('id', playerIds);
    } else {
      // No players found with selected tags - return empty results
      return {
        players: [],
        nextCursor: undefined,
        hasNextPage: false,
      };
    }
  } else if (filters.tags && filters.tags.length > 0 && !userWalletAddress) {
    // User not logged in but trying to filter by tags - return empty results
    return {
      players: [],
      nextCursor: undefined,
      hasNextPage: false,
    };
  }

  // Apply cursor pagination
  if (pageParam) {
    query = query.lt('id', parseInt(pageParam));
  }

  // Apply filters
  if (filters.search) {
    // Use the computed search_text column for unified search
    const searchTerm = filters.search.trim().toLowerCase();
    query = query.ilike('search_text', `%${searchTerm}%`);
  }

  if (filters.nationalities && filters.nationalities.length > 0) {
    query = query.in('nationality', filters.nationalities);
  }

  if (filters.positions && filters.positions.length > 0) {
    query = query.in('primary_position', filters.positions);
  }

  if (filters.secondaryPositions && filters.secondaryPositions.length > 0) {
    // Use contains for exact array element matching
    const secondaryConditions = filters.secondaryPositions.map(
      (pos) => `secondary_positions.cs.{${pos}}`
    );
    query = query.or(secondaryConditions.join(','));
  }

  if (filters.preferredFoot) {
    query = query.eq('preferred_foot', filters.preferredFoot);
  }

  if (filters.owners && filters.owners.length > 0) {
    query = query.in('owner_name', filters.owners);
  }

  if (filters.clubs && filters.clubs.length > 0) {
    // Handle "Free Agent" filter separately
    const hasFreeAgent = filters.clubs.includes('Free Agent');
    const regularClubs = filters.clubs.filter((club) => club !== 'Free Agent');

    if (hasFreeAgent && regularClubs.length > 0) {
      // Both free agents and specific clubs
      query = query.or(
        `club_name.is.null,club_name.in.(${regularClubs.join(',')})`
      );
    } else if (hasFreeAgent) {
      // Only free agents
      query = query.is('club_name', null);
    } else if (regularClubs.length > 0) {
      // Only specific clubs
      query = query.in('club_name', regularClubs);
    }
  }

  if (filters.bestPositions && filters.bestPositions.length > 0) {
    query = query.in('best_position', filters.bestPositions);
  }

  // Age filters
  if (filters.ageMin !== undefined) {
    query = query.gte('age', filters.ageMin);
  }
  if (filters.ageMax !== undefined) {
    query = query.lte('age', filters.ageMax);
  }

  // Height filters
  if (filters.heightMin !== undefined) {
    query = query.gte('height', filters.heightMin);
  }
  if (filters.heightMax !== undefined) {
    query = query.lte('height', filters.heightMax);
  }

  // Rating filters
  const ratingFields = [
    'overall',
    'pace',
    'shooting',
    'passing',
    'dribbling',
    'defense',
    'physical',
  ];

  ratingFields.forEach((field) => {
    const minKey = `${field}Min` as keyof PlayersApiFilters;
    const maxKey = `${field}Max` as keyof PlayersApiFilters;

    if (filters[minKey] !== undefined) {
      query = query.gte(field, filters[minKey]!);
    }
    if (filters[maxKey] !== undefined) {
      query = query.lte(field, filters[maxKey]!);
    }
  });

  // Best overall filters
  if (filters.bestOverallMin !== undefined) {
    query = query.gte('best_ovr', filters.bestOverallMin);
  }
  if (filters.bestOverallMax !== undefined) {
    query = query.lte('best_ovr', filters.bestOverallMax);
  }

  // Market value filters
  if (
    filters.marketValueMin !== undefined &&
    filters.marketValueMax !== undefined
  ) {
    // Handle both min and max together
    if (filters.marketValueMax === 3000) {
      // If max is 3000 (infinity), only apply min filter
      query = query.gte('market_value_estimate', filters.marketValueMin);
    } else {
      // Normal range filter
      query = query.gte('market_value_estimate', filters.marketValueMin);
      query = query.lte('market_value_estimate', filters.marketValueMax);
    }
  } else if (filters.marketValueMin !== undefined) {
    query = query.gte('market_value_estimate', filters.marketValueMin);
  } else if (filters.marketValueMax !== undefined) {
    // If max is 3000 (the maximum), don't apply any filter (show all)
    if (filters.marketValueMax !== 3000) {
      query = query.lte('market_value_estimate', filters.marketValueMax);
    }
  }

  // Price difference filters
  if (
    filters.priceDiffMin !== undefined &&
    filters.priceDiffMax !== undefined
  ) {
    // Handle both min and max together
    if (filters.priceDiffMax === 3000) {
      // Max is 3000 (infinity), only apply min filter
      query = query.gte('price_difference', filters.priceDiffMin);
    } else {
      // Normal range filter
      query = query.gte('price_difference', filters.priceDiffMin);
      query = query.lte('price_difference', filters.priceDiffMax);
    }
  } else if (filters.priceDiffMin !== undefined) {
    query = query.gte('price_difference', filters.priceDiffMin);
  } else if (filters.priceDiffMax !== undefined) {
    // If max is 3000 (the maximum), don't apply any filter (show all)
    if (filters.priceDiffMax !== 3000) {
      query = query.lte('price_difference', filters.priceDiffMax);
    }
  }

  // Wallet address filter
  if (filters.walletAddress) {
    query = query.eq('owner_wallet_address', filters.walletAddress);
  }

  // Sorting - map API field names to database column names
  if (filters.sortBy && filters.sortOrder) {
    const ascending = filters.sortOrder.toLowerCase() === 'asc';

    // Map API field names to database column names
    const sortFieldMap: Record<string, string> = {
      'metadata.pace': 'pace',
      'metadata.shooting': 'shooting',
      'metadata.passing': 'passing',
      'metadata.dribbling': 'dribbling',
      'metadata.defense': 'defense',
      'metadata.physical': 'physical',
      'metadata.overall': 'overall',
      'metadata.age': 'age',
      'metadata.height': 'height',
      'metadata.firstName': 'first_name',
      'metadata.lastName': 'last_name',
      'metadata.preferredFoot': 'preferred_foot',
      id: 'id',
      // Add computed fields that can be sorted
      bestPosition: 'best_position_index',
      bestOvr: 'best_ovr',
      bestRating: 'best_ovr',
      ovrDifference: 'ovr_difference',
      difference: 'ovr_difference',
      'marketValue.estimate': 'market_value_estimate',
      'currentListing.price': 'current_listing_price',
      priceDifference: 'price_difference',
      'ownedBy.name': 'owner_name_lower',
      'club.name': 'club_name_lower',
    };

    // Handle array fields with PostgreSQL array indexing
    let dbColumn = sortFieldMap[filters.sortBy] || filters.sortBy;

    // Convert array access to new field names
    if (filters.sortBy === 'metadata.nationalities[0]') {
      // Sort by nationality field
      query = query.order('nationality', { ascending });
    } else if (filters.sortBy === 'metadata.positions[0]') {
      // Sort by position_index field for proper position ordering
      query = query.order('position_index', { ascending });
    } else if (
      filters.sortBy === 'currentListing.price' ||
      filters.sortBy === 'priceDifference'
    ) {
      // Sort price fields with nulls last for both ascending and descending
      query = query.order(dbColumn, { ascending, nullsFirst: false });
    } else {
      // Regular field sorting
      query = query.order(dbColumn, { ascending });
    }
  } else {
    // Default sort by ID descending for consistent pagination
    query = query.order('id', { ascending: false });
  }

  const { data, error } = await query;

  console.log({ data });

  if (error) {
    console.error('Database query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  if (!data) {
    return {
      players: [],
      nextCursor: undefined,
      hasNextPage: false,
    };
  }

  // Transform database rows to match expected PlayerWithFavouriteData structure
  const players: PlayerWithFavouriteData[] = data.map((row) => ({
    id: row.id,
    metadata: {
      id: row.id,
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      age: row.age || 0,
      height: row.height || 0,
      nationalities: row.nationality ? [row.nationality] : [],
      positions: row.primary_position
        ? [row.primary_position, ...(row.secondary_positions || [])]
        : [],
      preferredFoot: row.preferred_foot || '',
      overall: row.overall || 0,
      pace: row.pace || 0,
      shooting: row.shooting || 0,
      passing: row.passing || 0,
      dribbling: row.dribbling || 0,
      defense: row.defense || 0,
      physical: row.physical || 0,
      goalkeeping: row.goalkeeping || 0,
      resistance: 0, // Default resistance value
    },
    // Additional computed fields
    bestPosition: row.best_position || undefined,
    bestOvr: row.best_ovr || undefined,
    ovrDifference: row.ovr_difference || undefined,
    marketValue: row.market_value_estimate
      ? {
          estimate: row.market_value_estimate,
          low: row.market_value_low || 0,
          high: row.market_value_high || 0,
          confidence: row.market_value_confidence || '',
          method: row.market_value_method || '',
        }
      : undefined,
    // Contract and owner info
    hasPreContract: row.has_pre_contract || false,
    energy: row.energy || 0,
    offerStatus: row.offer_status || 0,
    activeContract: row.contract_id
      ? {
          id: row.contract_id,
          status: row.contract_status || '',
          kind: '', // Default empty kind
          revenueShare: 0,
          totalRevenueShareLocked: 0,
          club: row.club_name
            ? {
                id: row.club_id || 0,
                name: row.club_name,
                mainColor: row.club_main_color || '',
                secondaryColor: row.club_secondary_color || '',
                city: '',
                division: 0,
                logoVersion: '',
                country: '',
                ownedBy: undefined,
                squads: [],
                type: row.club_type || undefined,
              }
            : {
                id: 0,
                name: '',
                mainColor: '',
                secondaryColor: '',
                city: '',
                division: 0,
                logoVersion: '',
                country: '',
                ownedBy: undefined,
                squads: [],
              },
          startSeason: 0,
          nbSeasons: 0,
          autoRenewal: false,
          createdDateTime: 0,
          clauses: [],
        }
      : undefined,
    ownedBy: row.owner_wallet_address
      ? {
          walletAddress: row.owner_wallet_address,
          name: row.owner_name || '',
          twitter: '',
          lastActive: 0,
        }
      : undefined,
    club: row.club_name
      ? {
          id: row.club_id || 0,
          name: row.club_name,
          mainColor: row.club_main_color || '',
          secondaryColor: row.club_secondary_color || '',
          city: '',
          division: 0,
          logoVersion: '',
          country: '',
          ownedBy: undefined,
          squads: [],
          type: row.club_type || undefined,
        }
      : undefined,
    // Market info
    currentListing: row.current_listing_price
      ? {
          price: row.current_listing_price,
        }
      : undefined,
    priceDifference: row.price_difference,
    // Required fields for PlayerWithFavouriteData
    position_ratings:
      (row.position_ratings as unknown as PositionRating[]) || [],
    is_favourite: row.favourites?.[0]?.is_favourite ?? false,
    tags: row.favourites?.[0]?.tags || [],
    lastSyncedAt: row.last_synced_at || undefined,
  }));

  return {
    players,
    nextCursor:
      players.length === pageSize
        ? players[players.length - 1].id.toString()
        : undefined,
    hasNextPage: players.length === pageSize,
  };
}

export function usePlayersInfiniteQuery(params: PlayersQueryParams = {}) {
  const { pageSize = 50, filters = {} } = params;

  return useInfiniteQuery({
    queryKey: ['players-db-infinite', pageSize, JSON.stringify(filters)],
    queryFn: ({ pageParam }) =>
      fetchPlayersFromDB({ pageParam: pageParam as string, pageSize, filters }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.nextCursor : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

// Main export for database-based queries
export const usePlayersQuery = usePlayersInfiniteQuery;
