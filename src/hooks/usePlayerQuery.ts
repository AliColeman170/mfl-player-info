'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PlayerWithFavouriteData } from '@/app/players-table/types';
import { Club, PositionRating } from '@/types/global.types';

async function fetchPlayerFromDB(
  id: number
): Promise<PlayerWithFavouriteData | null> {
  const supabase = createClient();

  // Get current user for favourites data
  const { data: userData } = await supabase.auth.getUser();
  const userWalletAddress = userData?.user?.app_metadata?.address;

  const query = supabase
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
      contract_id,
      contract_status,
      contract_kind,
      revenue_share,
      total_revenue_share_locked,
      club_id,
      club_name,
      club_division,
      club_type,
      owner_wallet_address,
      owner_name,
      best_position,
      best_ovr,
      ovr_difference,
      position_index,
      best_position_index,
      market_value_estimate,
      market_value_confidence,
      market_value_method,
      market_value_updated_at,
      position_ratings,
      best_position_rating,
      best_position_difference,
      last_synced_at,
      created_at,
      updated_at,
      data_hash,
      is_retired,
      is_burned,
      favourites (
        is_favourite,
        tags
      )
    `
    )
    .eq('id', id);

  // Add favourites join if user is logged in
  if (userWalletAddress) {
    query.eq('favourites.wallet_address', userWalletAddress);
  }

  const { data: player, error } = await query.single();

  console.log({ data: player, error });

  if (error) {
    console.error('Error fetching player:', error);
    return null;
  }

  if (!player) {
    return null;
  }

  // Transform database data to match the expected Player type structure
  const transformedPlayer: PlayerWithFavouriteData = {
    id: player.id,
    metadata: {
      id: player.id,
      firstName: player.first_name || '',
      lastName: player.last_name || '',
      age: player.age || 0,
      height: player.height || 0,
      nationalities: player.nationality ? [player.nationality] : [],
      positions: [
        player.primary_position,
        ...(player.secondary_positions || []),
      ].filter((pos): pos is string => Boolean(pos)),
      preferredFoot: player.preferred_foot || '',
      overall: player.overall || 0,
      pace: player.pace || 0,
      shooting: player.shooting || 0,
      passing: player.passing || 0,
      dribbling: player.dribbling || 0,
      defense: player.defense || 0,
      physical: player.physical || 0,
      goalkeeping: player.goalkeeping || 0,
    },
    activeContract: player.contract_id
      ? {
          id: player.contract_id,
          status: player.contract_status || '',
          kind: player.contract_kind || '',
          revenueShare: player.revenue_share || 0,
          totalRevenueShareLocked: player.total_revenue_share_locked || 0,
          club: player.club_id
            ? {
                id: player.club_id,
                name: player.club_name || '',
                division: player.club_division || 0,
                type: player.club_type || '',
              }
            : ({} as Club),
        }
      : undefined,
    club: player.club_id
      ? {
          id: player.club_id,
          name: player.club_name || '',
          division: player.club_division || 0,
          type: player.club_type || '',
        }
      : undefined,
    ownedBy: player.owner_wallet_address
      ? {
          walletAddress: player.owner_wallet_address,
          name: player.owner_name || '',
        }
      : undefined,
    marketValue: player.market_value_estimate
      ? {
          estimate: player.market_value_estimate,
          confidence:
            (player.market_value_confidence as 'high' | 'medium' | 'low') ||
            'low',
          method: player.market_value_method || 'unknown',
        }
      : undefined,
    // Additional PlayerWithFavouriteData fields
    position_ratings: Array.isArray(player.position_ratings)
      ? (player.position_ratings as unknown as PositionRating[])
      : [],
    is_favourite: player.favourites?.[0]?.is_favourite || false,
    tags: player.favourites?.[0]?.tags || [],
    lastSyncedAt: player.last_synced_at || undefined,

    // Computed fields
    bestPosition: player.best_position || undefined,
    bestOvr: player.best_ovr || undefined,
    ovrDifference: player.ovr_difference || undefined,
    is_burned: player.is_burned || false,
    is_retired: player.is_retired || false,
  };

  return transformedPlayer;
}

export function usePlayerQuery(id: number) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => fetchPlayerFromDB(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!id,
  });
}
