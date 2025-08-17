import 'server-only';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';
import { Player } from '@/types/global.types';
import { getPlayerPositionFamiliarityRatings } from '@/utils/helpers';
import { getPositionIndex } from '@/lib/constants';

/**
 * Rate limiting for /players endpoint (different from listings)
 * More generous rate limit, so we use a shorter delay
 */
export const PLAYERS_API_RATE_LIMIT_DELAY = 1000;

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Enhanced retry with rate limiting support
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000,
  stageName?: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      let delay: number;

      // Special handling for rate limiting (403/429 errors)
      if (error instanceof RateLimitError) {
        delay = baseDelay * Math.pow(3, attempt) + Math.random() * 2000;
        console.log(
          `${stageName ? `[${stageName}] ` : ''}Rate limit hit (${error.statusCode}), backing off for ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`
        );
      } else {
        delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(
          `${stageName ? `[${stageName}] ` : ''}Request failed: ${lastError.message}. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`
        );
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Import a single player by ID when missing from database
 * Used to recover from foreign key constraint errors during sales/listings import
 */
export async function importMissingPlayer(playerId: number): Promise<boolean> {
  console.log(`[Core] Attempting to import missing player ${playerId}`);

  try {
    // Fetch player from API with retry
    const player = await withRetry(
      () => fetchPlayerFromAPI(playerId),
      3, // maxRetries
      PLAYERS_API_RATE_LIMIT_DELAY,
      'missing_player_import'
    );

    if (!player) {
      console.error(`[Core] Player ${playerId} not found in API`);
      return false;
    }

    // Transform to database format with computed fields
    const computedFields = calculateEssentialFields(player);

    const dbRecord = {
      // Basic player info
      id: player.id,
      first_name: player.metadata.firstName || null,
      last_name: player.metadata.lastName || null,
      age: player.metadata.age || null,
      height: player.metadata.height || null,
      nationality: player.metadata.nationalities?.[0] || null,
      primary_position: player.metadata.positions?.[0] || null,
      secondary_positions: player.metadata.positions?.slice(1) || [],
      preferred_foot: player.metadata.preferredFoot || null,
      is_retired: false, // Assume active if we're importing due to sales/listings

      // Player stats
      overall: player.metadata.overall || null,
      pace: player.metadata.pace || null,
      shooting: player.metadata.shooting || null,
      passing: player.metadata.passing || null,
      dribbling: player.metadata.dribbling || null,
      defense: player.metadata.defense || null,
      physical: player.metadata.physical || null,
      goalkeeping: player.metadata.goalkeeping || null,
      resistance: player.metadata.resistance || null,

      // Contract information
      has_pre_contract: player.hasPreContract || false,
      energy: player.energy || null,
      offer_status: player.offerStatus || null,
      offer_min_division: player.offerMinDivision || null,
      offer_min_revenue_share: player.offerMinRevenueShare || null,
      offer_auto_accept: player.offerAutoAccept || false,

      // Active contract data
      contract_id: player.activeContract?.id || null,
      contract_status: player.activeContract?.status || null,
      contract_kind: player.activeContract?.kind || null,
      revenue_share: player.activeContract?.revenueShare || null,
      total_revenue_share_locked:
        player.activeContract?.totalRevenueShareLocked || null,
      start_season: player.activeContract?.startSeason || null,
      nb_seasons: player.activeContract?.nbSeasons || null,
      auto_renewal: player.activeContract?.autoRenewal || false,
      contract_created_date_time:
        player.activeContract?.createdDateTime || null,
      clauses: player.activeContract?.clauses
        ? JSON.stringify(player.activeContract.clauses)
        : null,

      // Club information
      club_id: player.activeContract?.club?.id || null,
      club_name: player.activeContract?.club?.name || null,
      club_main_color: player.activeContract?.club?.mainColor || null,
      club_secondary_color: player.activeContract?.club?.secondaryColor || null,
      club_city: player.activeContract?.club?.city || null,
      club_division: player.activeContract?.club?.division || null,
      club_logo_version: player.activeContract?.club?.logoVersion || null,
      club_country: player.activeContract?.club?.country || null,
      club_type: player.activeContract?.club?.type || null,

      // Owner information
      owner_wallet_address: player.ownedBy?.walletAddress || null,
      owner_name: player.ownedBy?.name || null,
      owner_twitter: player.ownedBy?.twitter || null,
      owner_last_active: player.ownedBy?.lastActive || null,

      // Computed fields for sorting and display
      best_position: computedFields.best_position,
      best_ovr: computedFields.best_ovr,
      ovr_difference: computedFields.ovr_difference,
      position_index: computedFields.position_index,
      best_position_index: computedFields.best_position_index,
      position_ratings: computedFields.position_ratings,

      // Sync metadata
      basic_data_synced_at: new Date().toISOString(),
      sync_stage: 'basic_imported',
      last_synced_at: new Date().toISOString(),
      sync_version: 2, // v2 sync system

      // Data hash for change detection
      data_hash: generateDataHash(player),
    };

    // Insert player into database
    const { error } = await supabase
      .from('players')
      .upsert([dbRecord], { onConflict: 'id' });

    if (error) {
      console.error(
        `[Core] Failed to insert missing player ${playerId}:`,
        error
      );
      return false;
    }

    console.log(`[Core] Successfully imported missing player ${playerId}`);

    // Rate limiting delay
    await sleep(PLAYERS_API_RATE_LIMIT_DELAY);

    return true;
  } catch (error) {
    console.error(`[Core] Error importing missing player ${playerId}:`, error);
    return false;
  }
}

/**
 * Fetch a single player from the API
 */
async function fetchPlayerFromAPI(playerId: number): Promise<Player | null> {
  const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players/${playerId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      // Player doesn't exist in API
      return null;
    }

    const errorMessage = `API request failed: ${url} Error: HTTP ${response.status}: ${response.statusText}`;

    // Handle rate limiting specifically
    if (response.status === 403 || response.status === 429) {
      throw new RateLimitError(errorMessage, response.status);
    }

    throw new Error(errorMessage);
  }

  const player = await response.json();
  return player;
}

/**
 * Calculate essential computed fields for individual player import (lightweight version)
 */
function calculateEssentialFields(player: Player) {
  const positionRatings = getPlayerPositionFamiliarityRatings(player, true);
  const bestPositionData = positionRatings?.[0] || {
    position: player.metadata.positions?.[0] || 'Unknown',
    rating: player.metadata.overall || 0,
    difference: 0,
  };

  const primaryPosition = player.metadata.positions?.[0] || null;

  return {
    best_position: bestPositionData.position || null,
    best_ovr: bestPositionData.rating || null,
    ovr_difference: bestPositionData.difference || null,
    position_index: getPositionIndex(primaryPosition || 'Unknown'),
    best_position_index: getPositionIndex(
      bestPositionData.position || 'Unknown'
    ),
    position_ratings: positionRatings,
  };
}

/**
 * Generate a simple hash of player data for change detection
 */
function generateDataHash(player: Player): string {
  const key = `${player.id}-${player.metadata.overall}-${player.metadata.age}-${player.activeContract?.status || 'none'}-${player.ownedBy?.walletAddress || 'none'}`;
  return Buffer.from(key).toString('base64').slice(0, 32);
}
