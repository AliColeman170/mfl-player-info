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
      resistance,
      has_pre_contract,
      energy,
      offer_status,
      offer_min_division,
      offer_min_revenue_share,
      offer_auto_accept,
      contract_id,
      contract_status,
      contract_kind,
      revenue_share,
      total_revenue_share_locked,
      start_season,
      nb_seasons,
      auto_renewal,
      contract_created_date_time,
      clauses,
      club_id,
      club_name,
      club_main_color,
      club_secondary_color,
      club_city,
      club_division,
      club_logo_version,
      club_country,
      club_type,
      owner_wallet_address,
      owner_name,
      owner_twitter,
      owner_last_active,
      current_listing_id,
      current_listing_price,
      current_listing_status,
      listing_created_date_time,
      last_sale_price,
      last_sale_date,
      best_position,
      best_ovr,
      ovr_difference,
      position_index,
      best_position_index,
      price_difference,
      market_value_estimate,
      market_value_low,
      market_value_high,
      market_value_confidence,
      market_value_method,
      market_value_sample_size,
      market_value_based_on,
      market_value_updated_at,
      position_ratings,
      best_position_rating,
      best_position_difference,
      last_synced_at,
      created_at,
      updated_at,
      sync_version,
      data_hash,
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
      resistance: player.resistance || 0,
    },
    activeContract: player.contract_id
      ? {
          id: player.contract_id,
          status: player.contract_status || '',
          kind: player.contract_kind || '',
          revenueShare: player.revenue_share || 0,
          totalRevenueShareLocked: player.total_revenue_share_locked || 0,
          startSeason: player.start_season || 0,
          nbSeasons: player.nb_seasons || 0,
          autoRenewal: player.auto_renewal || false,
          createdDateTime: player.contract_created_date_time || 0,
          clauses: Array.isArray(player.clauses) ? player.clauses.filter((clause): clause is string => typeof clause === 'string') : [],
          club: player.club_id
            ? {
                id: player.club_id,
                name: player.club_name || '',
                mainColor: player.club_main_color || '',
                secondaryColor: player.club_secondary_color || '',
                city: player.club_city || '',
                division: player.club_division || 0,
                logoVersion: player.club_logo_version || '',
                country: player.club_country || '',
                type: player.club_type || '',
                squads: [],
              }
            : {} as Club,
        }
      : undefined,
    club: player.club_id
      ? {
          id: player.club_id,
          name: player.club_name || '',
          mainColor: player.club_main_color || '',
          secondaryColor: player.club_secondary_color || '',
          city: player.club_city || '',
          division: player.club_division || 0,
          logoVersion: player.club_logo_version || '',
          country: player.club_country || '',
          type: player.club_type || '',
          squads: [],
        }
      : undefined,
    ownedBy: player.owner_wallet_address
      ? {
          walletAddress: player.owner_wallet_address,
          name: player.owner_name || '',
          twitter: player.owner_twitter || '',
          lastActive: player.owner_last_active || undefined,
        }
      : undefined,
    currentListing: player.current_listing_id
      ? {
          price: player.current_listing_price || 0,
        }
      : undefined,
    hasPreContract: player.has_pre_contract || false,
    energy: player.energy || 0,
    offerStatus: player.offer_status || 0,
    offerMinDivision: player.offer_min_division || undefined,
    offerMinRevenueShare: player.offer_min_revenue_share || undefined,
    offerAutoAccept: player.offer_auto_accept || undefined,
    marketValue: player.market_value_estimate ? {
      estimate: player.market_value_estimate,
      low: player.market_value_low || 0,
      high: player.market_value_high || 0,
      confidence: (player.market_value_confidence as 'high' | 'medium' | 'low') || 'low',
      method: player.market_value_method || 'unknown',
      basedOn: player.market_value_based_on || 'unknown',
      sampleSize: player.market_value_sample_size || 0,
    } : undefined,
    // Additional PlayerWithFavouriteData fields
    position_ratings: Array.isArray(player.position_ratings) ? (player.position_ratings as unknown as PositionRating[]) : [],
    is_favourite: player.favourites?.[0]?.is_favourite || false,
    tags: player.favourites?.[0]?.tags || [],
    lastSyncedAt: player.last_synced_at || undefined,

    // Computed fields
    bestPosition: player.best_position || undefined,
    bestOvr: player.best_ovr || undefined,
    ovrDifference: player.ovr_difference || undefined,
    priceDifference: player.price_difference || null,
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
