import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Player, Listing } from '@/types/global.types';
import { getPositionIndex } from '@/lib/constants';
import { getPlayerPositionFamiliarityRatings } from '@/utils/helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface UpsertResult {
  error: { message: string } | null;
}

interface UpsertPlayersResult {
  errors: string[];
  processed: number;
  failed: number;
}

const MAX_PLAYERS_LIMIT = 1500; // Max limit for player fetches
const MAX_SALES_LIMIT = 50; // Max limit for sales fetches
const BATCH_SIZE = 100; // Players batch size for upserts
const SALES_BATCH_SIZE = 5000; // Sales batch size for upserts

const DEV_CUT_OFF = 5000; // For development, limit to 5000 players
const DEV_SALES_CUT_OFF = 200; // For development, limit to 200 sales

/**
 * Get sync configuration value
 */
export async function getSyncConfig(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('sync_config')
    .select('config_value')
    .eq('config_key', key)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error(`Failed to get sync config for ${key}:`, error);
    return null;
  }

  return data.config_value;
}

/**
 * Set sync configuration value
 */
export async function setSyncConfig(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('sync_config').upsert(
    {
      config_key: key,
      config_value: value,
    },
    {
      onConflict: 'config_key',
    }
  );

  if (error) {
    console.error(`Failed to set sync config for ${key}:`, error);
    throw new Error(`Failed to set sync config: ${error.message}`);
  }
}

/**
 * Calculate essential computed fields for bulk import (lightweight version)
 */
function calculateEssentialFields(player: Player) {
  const ratingsStartTime = Date.now();
  const positionRatings = getPlayerPositionFamiliarityRatings(player, true);
  const ratingsDuration = Date.now() - ratingsStartTime;

  // Log slow calculations (> 5ms per player is concerning)
  if (ratingsDuration > 5) {
    console.log(
      `[Performance] Position ratings took ${ratingsDuration}ms for player ${player.id}`
    );
  }
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

/**
 * Get cursor from most recent sale in database
 * Returns null if no sales exist (triggers complete import)
 */
export async function getLastSaleCursor(): Promise<number | null> {
  const { data: lastSale } = await supabase
    .from('sales')
    .select('listing_resource_id')
    .order('purchase_date_time', { ascending: false })
    .limit(1)
    .single();

  return lastSale?.listing_resource_id || null;
}

function transformPlayerData(players: Player[]) {
  return players.map((player) => {
    const computedFields = calculateEssentialFields(player);

    return {
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
      is_retired: false,

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

      // Active contract data
      contract_id: player.activeContract?.id || null,
      contract_status: player.activeContract?.status || null,
      contract_kind: player.activeContract?.kind || null,
      revenue_share: player.activeContract?.revenueShare || null,
      total_revenue_share_locked:
        player.activeContract?.totalRevenueShareLocked || null,

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
  });
}

export async function upsertPlayersToDatabase(
  players: Player[]
): Promise<UpsertPlayersResult> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  const allDbRecords = transformPlayerData(players);

  // Process in small, fast batches with no delays
  for (let i = 0; i < allDbRecords.length; i += BATCH_SIZE) {
    const batch = allDbRecords.slice(i, i + BATCH_SIZE);

    // Fast upsert with small batch - ADD TIMING
    const batchStartTime = Date.now();
    const { error }: UpsertResult = await supabase
      .from('players')
      .upsert(batch, { onConflict: 'id' });
    const batchDuration = Date.now() - batchStartTime;

    if (error) {
      console.error(
        `[Players Import] Database error for batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );
      console.log(
        `[Performance] Failed batch took ${batchDuration}ms for ${batch.length} records`
      );
      errors.push(`Database error: ${error.message}`);
      failed += batch.length;
    } else {
      processed += batch.length;
      console.log(
        `[Players Import] Processed ${processed}/${allDbRecords.length} players`
      );
    }
  }

  console.log(
    `[Players Import] Upsert completed players: ${allDbRecords[0].id} to ${allDbRecords[allDbRecords.length - 1].id}`
  );
  return { errors, processed, failed };
}

export async function getQueryParams(
  configKey: string,
  isRetired: boolean,
  isBurned: boolean
): Promise<Record<string, string | number | boolean | undefined>> {
  const lastPlayerIdStr = await getSyncConfig(configKey);

  let beforePlayerId: number | undefined =
    lastPlayerIdStr && lastPlayerIdStr !== '0'
      ? parseInt(lastPlayerIdStr)
      : undefined;

  const params: Record<string, string | number | boolean | undefined> = {
    limit: MAX_PLAYERS_LIMIT,
    sorts: 'id',
    sortsOrders: 'ASC',
  };

  // Use beforePlayerId for pagination with ascending sort
  if (beforePlayerId) {
    params.beforePlayerId = beforePlayerId;
  }

  if (isRetired !== undefined) {
    params.isRetired = isRetired;
  }

  // For burned players, use the specific burned wallet address
  if (isBurned) {
    params.ownerWalletAddress = '0x6fec8986261ecf49';
  }

  console.log(`[Params] Query params for ${configKey}:`, params);
  return params;
}

export async function getSalesQueryParams(): Promise<
  Record<string, string | number | boolean | undefined>
> {
  const beforeListingId = await getLastSaleCursor();

  const params: Record<string, string | number> = {
    limit: MAX_SALES_LIMIT,
    type: 'PLAYER',
    status: 'BOUGHT', // Filter MFL /listings for sales only
    marketplace: 'all',
    sorts: 'listing.purchaseDateTime', // MFL API sort field
    sortsOrders: 'ASC', // Chronological order
  };

  // Use beforePlayerId for pagination with ascending sort
  if (beforeListingId) {
    params.beforeListingId = beforeListingId;
  }

  console.log(`[Params] Query params for lisitngs:`, params);
  return params;
}

function transformSaleData(listings: Listing[]) {
  return listings.map((sale) => ({
    listing_resource_id: sale.listingResourceId,
    player_id: sale.player?.id || 0,
    price: sale.price,
    seller_wallet_address: sale.sellerAddress || null,
    buyer_wallet_address: null, // Not available in listings endpoint
    created_date_time: sale.createdDateTime,
    purchase_date_time: sale.purchaseDateTime || null,
    status: sale.status,

    // Player metadata for fast filtering
    player_age: sale.player?.metadata?.age || null,
    player_overall: sale.player?.metadata?.overall || null,
    player_position: sale.player?.metadata?.positions?.[0] || null,
  }));
}

export async function upsertSalesToDatabase(
  listings: Listing[]
): Promise<UpsertPlayersResult> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  const allDbRecords = transformSaleData(
    listings.filter((sale) => sale.player!.id >= 42)
  );

  // Process in small, fast batches with no delays
  for (let i = 0; i < allDbRecords.length; i += BATCH_SIZE) {
    const batch = allDbRecords.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('sales').upsert(allDbRecords, {
      onConflict: 'listing_resource_id',
      count: 'exact',
    });

    if (error) {
      console.error(
        `[Sales Import] Database error for batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );
      errors.push(`Database error: ${error.message}`);
      failed += batch.length;
    } else {
      processed += batch.length;
      console.log(
        `[Sales Import] Processed ${processed}/${allDbRecords.length} sales`
      );
    }
  }

  console.log(
    `[Sales Import] Upsert completed sales: ${allDbRecords[0].listing_resource_id} to ${allDbRecords[allDbRecords.length - 1].listing_resource_id}`
  );
  return { errors, processed, failed };
}

// Export constants
export {
  MAX_PLAYERS_LIMIT,
  MAX_SALES_LIMIT,
  DEV_CUT_OFF,
  DEV_SALES_CUT_OFF,
  SALES_BATCH_SIZE,
};
