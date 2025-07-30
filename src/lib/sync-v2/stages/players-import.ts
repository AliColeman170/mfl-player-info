import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Player } from '@/types/global.types';
import { calculateComputedFields } from '@/lib/sync/computed-fields';
import { getPlayerPositionFamiliarityRatings } from '@/utils/helpers';
import { getPositionIndex } from '@/lib/constants';
import {
  startSyncExecution,
  completeSyncExecution,
  updateSyncProgress,
  withRetry,
  sleep,
  RateLimitError,
  SyncCancelledException,
  getSyncConfig,
  setSyncConfig,
  type SyncResult,
} from '../core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGE_NAME = 'players_import';

export interface PlayersImportOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: PlayersImportOptions = {
  batchSize: 1500, // API page size
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Import players with basic data only (no market value calculations)
 */
export async function importPlayersBasicData(
  options: PlayersImportOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('[Players Import] Starting basic player data import...');
  
  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalFetched = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Import both active and retired players
    const mergedOpts = { ...DEFAULT_OPTIONS, ...opts };
    const importResults = await Promise.all([
      importPlayersByType(false, executionId, mergedOpts), // Active players
      importPlayersByType(true, executionId, mergedOpts),  // Retired players
    ]);

    // Combine results
    for (const result of importResults) {
      totalFetched += result.fetched;
      totalProcessed += result.processed;
      totalFailed += result.failed;
      errors.push(...result.errors);
    }

    // Mark as completed and cleanup
    const success = errors.length === 0;
    const duration = Date.now() - startTime;

    if (success) {
      // Clear resumable progress since we completed successfully
      await setSyncConfig('last_player_id_imported', '');
      await setSyncConfig('last_retired_player_id_imported', '');
    }

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(`[Players Import] Completed: fetched ${totalFetched}, processed ${totalProcessed}, failed ${totalFailed}`);

    return {
      success,
      duration,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalFetched,
        activeResults: importResults[0],
        retiredResults: importResults[1],
      },
    };

  } catch (error) {
    console.error('[Players Import] Fatal error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    await completeSyncExecution(executionId, 'failed', errorMsg);
    
    return {
      success: false,
      duration: Date.now() - startTime,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors: [errorMsg, ...errors],
    };
  }
}

/**
 * Import players by type (active or retired)
 */
async function importPlayersByType(
  isRetired: boolean,
  executionId: number,
  opts: Required<PlayersImportOptions>
): Promise<{ fetched: number; processed: number; failed: number; errors: string[] }> {
  const playerType = isRetired ? 'retired' : 'active';
  console.log(`[Players Import] Starting ${playerType} players import...`);

  let totalFetched = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Check for resumable progress
    const configKey = isRetired ? 'last_retired_player_id_imported' : 'last_player_id_imported';
    const lastPlayerIdStr = await getSyncConfig(configKey);
    let beforePlayerId: number | undefined = lastPlayerIdStr ? parseInt(lastPlayerIdStr) : undefined;
    
    console.log(`[Players Import] ${beforePlayerId ? `Resuming ${playerType} from player ID ${beforePlayerId}` : `Starting fresh ${playerType} import`}`);

    let hasMore = true;
    let currentPage = 1;
    const maxPages = 1000; // Safety limit

    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(`[Players Import] Fetching ${playerType} page ${currentPage}${beforePlayerId ? `, beforePlayerId: ${beforePlayerId}` : ''}`);

        // Fetch players page with retry
        const playersPage = await withRetry(
          () => fetchPlayersPage(opts.batchSize, beforePlayerId, isRetired),
          opts.maxRetries,
          opts.retryDelay,
          STAGE_NAME
        );

        if (!playersPage || playersPage.length === 0) {
          console.log(`[Players Import] No more ${playerType} players to fetch`);
          hasMore = false;
          break;
        }

        totalFetched += playersPage.length;

        // Process players in smaller batches for database operations
        const processingResult = await processPlayersBasic(playersPage, executionId, isRetired);
        totalProcessed += processingResult.processed;
        totalFailed += processingResult.failed;
        errors.push(...processingResult.errors);

        // Update progress (this will throw SyncCancelledException if cancelled)
        await updateSyncProgress(executionId, totalProcessed, totalFailed, {
          currentPage: `${playerType}-${currentPage}`,
          totalFetched,
          lastPlayerId: playersPage[playersPage.length - 1]?.id,
          playerType,
        });

        // Save progress for resumability
        const lastPlayerId = playersPage[playersPage.length - 1]?.id;
        if (lastPlayerId) {
          await setSyncConfig(configKey, lastPlayerId.toString());
        }

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalProcessed, totalFetched);
        }

        // Check if last page (less than requested amount)
        if (playersPage.length < opts.batchSize) {
          console.log(`[Players Import] Received ${playersPage.length} ${playerType} results (less than ${opts.batchSize}). Last page reached.`);
          hasMore = false;
        } else {
          beforePlayerId = lastPlayerId;
          currentPage++;
        }

        console.log(`[Players Import] ${playerType} page ${currentPage - 1} complete: processed ${processingResult.processed}, total processed: ${totalProcessed}`);

        // Rate limiting delay
        await sleep(3000);

      } catch (error) {
        // Handle sync cancellation specially
        if (error instanceof SyncCancelledException) {
          console.log(`[Players Import] ${playerType} import cancelled by user`);
          errors.push(`${playerType} import cancelled by user`);
          break;
        }

        console.error(`[Players Import] Error processing ${playerType} page ${currentPage}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${playerType} page ${currentPage} failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 10) {
          console.error(`[Players Import] Too many errors, stopping ${playerType} import`);
          break;
        }
        currentPage++;
      }
    }

    console.log(`[Players Import] ${playerType} import completed: fetched ${totalFetched}, processed ${totalProcessed}, failed ${totalFailed}`);

  } catch (error) {
    // Handle sync cancellation specially
    if (error instanceof SyncCancelledException) {
      console.log(`[Players Import] ${playerType} import cancelled by user`);
      errors.push(`${playerType} import cancelled by user`);
    } else {
      console.error(`[Players Import] Fatal error during ${playerType} import:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${playerType} import failed: ${errorMsg}`);
      totalFailed = totalFetched; // Mark all as failed
    }
  }

  return { fetched: totalFetched, processed: totalProcessed, failed: totalFailed, errors };
}

/**
 * Fetch players from API using ascending ID sort order
 */
async function fetchPlayersPage(limit: number, beforePlayerId?: number, isRetired?: boolean): Promise<Player[]> {
  const params: Record<string, string | number | boolean> = {
    limit,
    sorts: 'id',
    sortsOrders: 'ASC',
  };
  
  if (beforePlayerId) {
    params.beforePlayerId = beforePlayerId;
  }

  if (isRetired !== undefined) {
    params.isRetired = isRetired;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  const url = `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?${queryString}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorMessage = `API request failed: ${url} Error: HTTP ${response.status}: ${response.statusText}`;
    
    // Handle rate limiting specifically
    if (response.status === 403 || response.status === 429) {
      throw new RateLimitError(errorMessage, response.status);
    }
    
    throw new Error(errorMessage);
  }
  
  const players = await response.json();
  return players;
}

/**
 * Process players with basic data only (no market value calculations)
 */
async function processPlayersBasic(
  players: Player[],
  executionId: number,
  isRetired: boolean = false
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Process in smaller batches for database operations
  const batchSize = 100;
  
  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize);
    
    try {
      // Transform to database format with computed fields
      const dbRecords = batch.map(player => {
        // Calculate essential computed fields
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
        is_retired: isRetired,
        
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
        total_revenue_share_locked: player.activeContract?.totalRevenueShareLocked || null,
        start_season: player.activeContract?.startSeason || null,
        nb_seasons: player.activeContract?.nbSeasons || null,
        auto_renewal: player.activeContract?.autoRenewal || false,
        contract_created_date_time: player.activeContract?.createdDateTime || null,
        clauses: player.activeContract?.clauses ? JSON.stringify(player.activeContract.clauses) : null,
        
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

      // Upsert to database
      const { error } = await supabase
        .from('players')
        .upsert(dbRecords, { onConflict: 'id' });

      if (error) {
        console.error(`[Players Import] Database error for batch:`, error);
        errors.push(`Database error: ${error.message}`);
        failed += batch.length;
      } else {
        processed += batch.length;
        console.log(`[Players Import] Successfully processed ${batch.length} players (batch ${Math.floor(i / batchSize) + 1})`);
      }

    } catch (error) {
      console.error(`[Players Import] Error processing batch:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown batch error';
      errors.push(`Batch error: ${errorMsg}`);
      failed += batch.length;
    }
    
    // Small delay between database batches
    await sleep(100);
  }

  return { processed, failed, errors };
}

/**
 * Calculate essential computed fields for bulk import (lightweight version)
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
    best_position_index: getPositionIndex(bestPositionData.position || 'Unknown'),
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
 * Get import statistics
 */
export async function getPlayersImportStats() {
  const { data: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true });

  const { data: playersWithBasicData } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('basic_data_synced_at', 'is', null);

  const { data: lastExecution } = await supabase
    .from('sync_executions')
    .select('*')
    .eq('stage_name', STAGE_NAME)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return {
    totalPlayers: totalPlayers || 0,
    playersWithBasicData: playersWithBasicData || 0,
    lastExecution: lastExecution || null,
  };
}