import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Player } from '@/types/global.types';
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
  batchSize: 1500, // API hard limit is 1500
  maxRetries: 5,
  retryDelay: 1000, // Reduced retry delay
};

export interface ChunkedImportOptions {
  maxPagesPerChunk?: number;
  continueFrom?: {
    playerType: string;
    lastPlayerId?: number;
    processedCounts: Record<string, number>;
  };
}

export interface ChunkedSyncResult extends SyncResult {
  isComplete: boolean;
  continueFrom?: {
    playerType: string;
    lastPlayerId?: number;
    processedCounts: Record<string, number>;
  };
  totalProgress?: {
    estimatedTotal: number;
    processed: number;
    percentage: number;
  };
}

/**
 * Import players in chunks to work around Vercel's 5-minute timeout
 */
export async function importPlayersBasicDataChunk(
  options: ChunkedImportOptions = {}
): Promise<ChunkedSyncResult> {
  const startTime = Date.now();
  const { maxPagesPerChunk = 2, continueFrom } = options;
  
  console.log('[Players Import] Starting chunked import with options:', options);
  
  const executionId = await startSyncExecution('players_import', 'api');
  let totalFetched = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];
  
  try {
    // Determine which player type to process and where to start
    const playerTypes = ['active-available', 'active-burnt', 'retired-available', 'retired-burnt'];
    let startFromType = continueFrom?.playerType || playerTypes[0];
    let startFromIndex = playerTypes.indexOf(startFromType);
    
    // If continuing, start from the specified type
    if (startFromIndex === -1) startFromIndex = 0;
    
    let processedCounts = continueFrom?.processedCounts || {
      'active-available': 0,
      'active-burnt': 0, 
      'retired-available': 0,
      'retired-burnt': 0,
    };
    
    let isComplete = false;
    let nextContinueFrom: ChunkedSyncResult['continueFrom'] | undefined;
    
    // Process one player type at a time
    for (let typeIndex = startFromIndex; typeIndex < playerTypes.length && !isComplete; typeIndex++) {
      const currentType = playerTypes[typeIndex];
      const [status, burn] = currentType.split('-');
      const isRetired = status === 'retired';
      const isBurned = burn === 'burnt';
      
      console.log(`[Players Import] Processing ${currentType}, starting from player ID:`, continueFrom?.lastPlayerId);
      
      const chunkResult = await importPlayerTypeChunk(
        isBurned,
        isRetired,
        executionId,
        {
          ...DEFAULT_OPTIONS,
          batchSize: 1500,
          maxRetries: 3,
          retryDelay: 1000,
        },
        maxPagesPerChunk,
        continueFrom?.playerType === currentType ? continueFrom.lastPlayerId : undefined
      );
      
      totalFetched += chunkResult.fetched;
      totalProcessed += chunkResult.processed;
      totalFailed += chunkResult.failed;
      errors.push(...chunkResult.errors);
      
      processedCounts[currentType] += chunkResult.processed;
      
      // If this chunk didn't complete the type, we need to continue from here
      if (!chunkResult.isTypeComplete) {
        nextContinueFrom = {
          playerType: currentType,
          lastPlayerId: chunkResult.lastPlayerId,
          processedCounts,
        };
        break;
      }
      
      // If we've completed all types, mark as complete
      if (typeIndex === playerTypes.length - 1) {
        isComplete = true;
      }
    }
    
    const success = errors.length === 0;
    const duration = Date.now() - startTime;
    
    if (isComplete && success) {
      // Reset config keys only when completely done
      await Promise.all([
        setSyncConfig('last_player_id_imported', '0'),
        setSyncConfig('last_retired_player_id_imported', '0'),
        setSyncConfig('last_burned_player_id_imported', '0'),
      ]);
      console.log('[Players Import] Complete import finished - config keys reset');
    }
    
    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 3).join('; ') : undefined
    );
    
    console.log(`[Players Import] Chunk completed: ${totalProcessed} processed, complete: ${isComplete}`);
    
    return {
      success,
      duration,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors,
      isComplete,
      continueFrom: nextContinueFrom,
      totalProgress: {
        estimatedTotal: 45000, // Rough estimate
        processed: Object.values(processedCounts).reduce((sum, count) => sum + count, 0),
        percentage: Math.min(100, (Object.values(processedCounts).reduce((sum, count) => sum + count, 0) / 45000) * 100),
      },
      metadata: {
        totalFetched,
        processedCounts,
        chunkSize: maxPagesPerChunk,
      },
    };
    
  } catch (error) {
    console.error('[Players Import] Fatal error in chunk:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    await completeSyncExecution(executionId, 'failed', errorMsg);
    
    return {
      success: false,
      duration: Date.now() - startTime,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors: [errorMsg, ...errors],
      isComplete: false,
    };
  }
}

/**
 * Import players with basic data only (no market value calculations) - FULL IMPORT
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
      importPlayersByType(
        false,
        false,
        executionId,
        mergedOpts as Required<PlayersImportOptions>
      ), // Active available players
      importPlayersByType(
        true,
        false,
        executionId,
        mergedOpts as Required<PlayersImportOptions>
      ), // Active burnt players
      importPlayersByType(
        false,
        true,
        executionId,
        mergedOpts as Required<PlayersImportOptions>
      ), // Retired available players
      importPlayersByType(
        true,
        true,
        executionId,
        mergedOpts as Required<PlayersImportOptions>
      ), // Retired burnt players
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
      // Reset config keys to '0' after successful full import so next run starts fresh
      await Promise.all([
        setSyncConfig('last_player_id_imported', '0'),
        setSyncConfig('last_retired_player_id_imported', '0'),
        setSyncConfig('last_burned_player_id_imported', '0'),
      ]);
      console.log(
        '[Players Import] Sync completed successfully - config keys reset to 0 for fresh start'
      );
    }

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(
      `[Players Import] Completed: fetched ${totalFetched}, processed ${totalProcessed}, failed ${totalFailed}`
    );

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
 * Import players by type in chunks (active or retired) - LIMITED PAGES
 */
async function importPlayerTypeChunk(
  isBurned: boolean,
  isRetired: boolean,
  executionId: number,
  opts: Required<PlayersImportOptions>,
  maxPages: number,
  startFromPlayerId?: number
): Promise<{
  fetched: number;
  processed: number;
  failed: number;
  errors: string[];
  isTypeComplete: boolean;
  lastPlayerId?: number;
}> {
  const playerType = isRetired ? 'retired' : 'active';
  const playerBurn = isBurned ? 'burnt' : 'available';
  console.log(`[Players Import] Starting chunked ${playerType} ${playerBurn} import (max ${maxPages} pages)`);

  let totalFetched = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];
  let lastPlayerId: number | undefined = startFromPlayerId;
  let isTypeComplete = false;

  try {
    // Get config key for resumable progress
    const configKey = isRetired
      ? 'last_retired_player_id_imported'
      : isBurned
        ? 'last_burned_player_id_imported'
        : 'last_player_id_imported';
    
    // Use provided startFromPlayerId or get from config
    if (!startFromPlayerId) {
      const lastPlayerIdStr = await getSyncConfig(configKey);
      lastPlayerId = lastPlayerIdStr && lastPlayerIdStr !== '0' 
        ? parseInt(lastPlayerIdStr) 
        : undefined;
    }

    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= maxPages) {
      const pageStartTime = Date.now();
      try {
        console.log(`[Players Import] Fetching ${playerType} ${playerBurn} chunk page ${currentPage}${lastPlayerId ? `, from ID: ${lastPlayerId}` : ''}`);

        // Fetch players page with timing
        const apiStartTime = Date.now();
        const playersPage = await withRetry(
          () => fetchPlayersPage(opts.batchSize, lastPlayerId, isRetired, isBurned),
          opts.maxRetries,
          opts.retryDelay,
          'players_import'
        );
        const apiDuration = Date.now() - apiStartTime;
        console.log(`[Performance] API fetch took ${apiDuration}ms for ${playersPage?.length || 0} players`);

        if (!playersPage || playersPage.length === 0) {
          console.log(`[Players Import] No more ${playerType} ${playerBurn} players - type complete`);
          isTypeComplete = true;
          hasMore = false;
          break;
        }

        totalFetched += playersPage.length;

        // Process players with timing
        const processingStartTime = Date.now();
        const processingResult = await processPlayersBasic(playersPage, isRetired);
        const processingDuration = Date.now() - processingStartTime;
        console.log(`[Performance] Processing took ${processingDuration}ms for ${playersPage.length} players`);

        totalProcessed += processingResult.processed;
        totalFailed += processingResult.failed;
        errors.push(...processingResult.errors);

        // Update progress and save checkpoint
        lastPlayerId = playersPage[playersPage.length - 1]?.id;
        if (lastPlayerId) {
          await setSyncConfig(configKey, lastPlayerId.toString());
        }

        await updateSyncProgress(executionId, totalProcessed, totalFailed, {
          currentPage: `${playerType}-chunk-${currentPage}`,
          totalFetched,
          lastPlayerId,
          playerType: `${playerType}-${playerBurn}`,
          maxPages,
        });

        // Check if this was the last page for this type
        if (playersPage.length < opts.batchSize) {
          console.log(`[Players Import] ${playerType} ${playerBurn} type completed (last page: ${playersPage.length} < ${opts.batchSize})`);
          isTypeComplete = true;
          hasMore = false;
        } else {
          currentPage++;
        }

        const pageEndTime = Date.now();
        console.log(`[Performance] Total page took ${pageEndTime - pageStartTime}ms`);
        
        // Short delay between pages
        await sleep(200);

      } catch (error) {
        if (error instanceof SyncCancelledException) {
          console.log(`[Players Import] ${playerType} ${playerBurn} chunk cancelled`);
          errors.push(`${playerType} chunk cancelled`);
          break;
        }

        console.error(`[Players Import] Error in ${playerType} ${playerBurn} chunk page ${currentPage}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${playerType} chunk page ${currentPage}: ${errorMsg}`);
        
        // Continue to next page on error
        currentPage++;
        if (errors.length > 5) {
          console.error(`[Players Import] Too many chunk errors, stopping ${playerType} ${playerBurn}`);
          break;
        }
      }
    }

    // If we processed maxPages but there might be more, not complete
    if (currentPage > maxPages && hasMore) {
      isTypeComplete = false;
    }

    console.log(`[Players Import] ${playerType} ${playerBurn} chunk complete: ${totalProcessed} processed, isComplete: ${isTypeComplete}`);

  } catch (error) {
    if (error instanceof SyncCancelledException) {
      console.log(`[Players Import] ${playerType} ${playerBurn} chunk cancelled`);
      errors.push(`${playerType} chunk cancelled`);
    } else {
      console.error(`[Players Import] Fatal error in ${playerType} ${playerBurn} chunk:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${playerType} chunk failed: ${errorMsg}`);
      totalFailed = totalFetched;
    }
  }

  return {
    fetched: totalFetched,
    processed: totalProcessed,
    failed: totalFailed,
    errors,
    isTypeComplete,
    lastPlayerId,
  };
}

/**
 * Import players by type (active or retired) - FULL TYPE IMPORT
 */
async function importPlayersByType(
  isBurned: boolean,
  isRetired: boolean,
  executionId: number,
  opts: Required<PlayersImportOptions>
): Promise<{
  fetched: number;
  processed: number;
  failed: number;
  errors: string[];
}> {
  const playerType = isRetired ? 'retired' : 'active';
  const playerBurn = isBurned ? 'burnt' : 'available';
  console.log(`[Players Import] Starting ${playerType} players import...`);

  let totalFetched = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Check for resumable progress to enable proper resumability
    const configKey = isRetired
      ? 'last_retired_player_id_imported'
      : isBurned
        ? 'last_burned_player_id_imported'
        : 'last_player_id_imported';
    const lastPlayerIdStr = await getSyncConfig(configKey);
    let beforePlayerId: number | undefined =
      lastPlayerIdStr && lastPlayerIdStr !== '0'
        ? parseInt(lastPlayerIdStr)
        : undefined;

    console.log(
      `[Players Import] ${beforePlayerId ? `Resuming ${playerType} ${playerBurn} from player ID ${beforePlayerId}` : `Starting fresh ${playerType} ${playerBurn} import`}`
    );

    let hasMore = true;
    let currentPage = 1;
    const maxPages = 1000; // Safety limit

    let previousProcessingPromise: Promise<any> | null = null;
    
    while (hasMore && currentPage <= maxPages) {
      const pageStartTime = Date.now();
      try {
        console.log(
          `[Players Import] Fetching ${playerType} ${playerBurn} page ${currentPage}${beforePlayerId ? `, beforePlayerId: ${beforePlayerId}` : ''}`
        );

        // Fetch players page with retry - ADD TIMING
        const apiStartTime = Date.now();
        const playersPage = await withRetry(
          () =>
            fetchPlayersPage(
              opts.batchSize,
              beforePlayerId,
              isRetired,
              isBurned
            ),
          opts.maxRetries,
          opts.retryDelay,
          STAGE_NAME
        );
        const apiDuration = Date.now() - apiStartTime;
        console.log(`[Performance] API fetch took ${apiDuration}ms for ${playersPage?.length || 0} players`);

        if (!playersPage || playersPage.length === 0) {
          console.log(
            `[Players Import] No more ${playerType} ${playerBurn} players to fetch`
          );
          hasMore = false;
          break;
        }

        totalFetched += playersPage.length;

        // Wait for previous page processing to complete before starting new one
        if (previousProcessingPromise) {
          const prevResult = await previousProcessingPromise;
          totalProcessed += prevResult.processed;
          totalFailed += prevResult.failed;
          errors.push(...prevResult.errors);
        }

        // Start processing current page (don't await yet - pipeline with next API fetch)
        const processingStartTime = Date.now();
        previousProcessingPromise = processPlayersBasic(playersPage, isRetired).then(result => {
          const processingDuration = Date.now() - processingStartTime;
          console.log(`[Performance] Database processing took ${processingDuration}ms for ${playersPage.length} players (${Math.round(processingDuration/playersPage.length)}ms per player)`);
          return result;
        });

        // Save progress for resumability and update pagination cursor
        const lastPlayerId = playersPage[playersPage.length - 1]?.id;
        if (lastPlayerId) {
          await setSyncConfig(configKey, lastPlayerId.toString());
        }

        // Check if last page (less than requested amount)
        if (playersPage.length < opts.batchSize) {
          console.log(
            `[Players Import] Received ${playersPage.length} ${playerType} results (less than ${opts.batchSize}). Last page reached.`
          );
          hasMore = false;
        } else {
          beforePlayerId = lastPlayerId;
          currentPage++;
        }

        console.log(
          `[Players Import] ${playerType} page ${currentPage} fetch complete, processing in background`
        );

        // Reduced rate limiting delay - API can handle faster requests  
        await sleep(100);
      } catch (error) {
        // Handle sync cancellation specially
        if (error instanceof SyncCancelledException) {
          console.log(
            `[Players Import] ${playerType} import cancelled by user`
          );
          errors.push(`${playerType} import cancelled by user`);
          break;
        }

        console.error(
          `[Players Import] Error processing ${playerType} page ${currentPage}:`,
          error
        );
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${playerType} page ${currentPage} failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 10) {
          console.error(
            `[Players Import] Too many errors, stopping ${playerType} import`
          );
          break;
        }
        currentPage++;
      }
    }

    // Process final batch if exists
    if (previousProcessingPromise) {
      const finalResult = await previousProcessingPromise;
      totalProcessed += finalResult.processed;
      totalFailed += finalResult.failed;
      errors.push(...finalResult.errors);
    }

    console.log(
      `[Players Import] ${playerType} import completed: fetched ${totalFetched}, processed ${totalProcessed}, failed ${totalFailed}`
    );
  } catch (error) {
    // Handle sync cancellation specially
    if (error instanceof SyncCancelledException) {
      console.log(`[Players Import] ${playerType} import cancelled by user`);
      errors.push(`${playerType} import cancelled by user`);
    } else {
      console.error(
        `[Players Import] Fatal error during ${playerType} import:`,
        error
      );
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${playerType} import failed: ${errorMsg}`);
      totalFailed = totalFetched; // Mark all as failed
    }
  }

  return {
    fetched: totalFetched,
    processed: totalProcessed,
    failed: totalFailed,
    errors,
  };
}

/**
 * Fetch players from API using ascending ID sort order
 */
async function fetchPlayersPage(
  limit: number,
  beforePlayerId?: number,
  isRetired?: boolean,
  isBurned?: boolean
): Promise<Player[]> {
  const params: Record<string, string | number | boolean> = {
    limit,
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
 * Process players with basic data only (no market value calculations) - FAST & RELIABLE
 */
async function processPlayersBasic(
  players: Player[],
  isRetired: boolean = false
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Use smaller batches that won't timeout, no delays for maximum speed
  const batchSize = 50; // Small enough to never timeout

  // Pre-transform all players to avoid doing this work in the loop - ADD TIMING
  const transformStartTime = Date.now();
  const allDbRecords = players.map((player) => {
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
  const transformDuration = Date.now() - transformStartTime;
  console.log(`[Performance] Data transformation took ${transformDuration}ms for ${players.length} players (${Math.round(transformDuration/players.length)}ms per player)`);

  // Process in small, fast batches with no delays
  for (let i = 0; i < allDbRecords.length; i += batchSize) {
    const batch = allDbRecords.slice(i, i + batchSize);

    try {
      // Fast upsert with small batch - ADD TIMING
      const batchStartTime = Date.now();
      const { error } = await supabase
        .from('players')
        .upsert(batch, { onConflict: 'id' });
      const batchDuration = Date.now() - batchStartTime;

      if (error) {
        console.error(
          `[Players Import] Database error for batch ${Math.floor(i / batchSize) + 1}:`,
          error
        );
        console.log(`[Performance] Failed batch took ${batchDuration}ms for ${batch.length} records`);
        errors.push(`Database error: ${error.message}`);
        failed += batch.length;
      } else {
        processed += batch.length;
        console.log(`[Performance] DB batch ${Math.floor(i / batchSize) + 1} took ${batchDuration}ms for ${batch.length} records (${Math.round(batchDuration/batch.length)}ms per record)`);
        // Less verbose logging for speed
        if ((Math.floor(i / batchSize) + 1) % 10 === 0) {
          console.log(
            `[Players Import] Processed ${processed}/${allDbRecords.length} players`
          );
        }
      }
    } catch (error) {
      console.error(`[Players Import] Error processing batch:`, error);
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown batch error';
      errors.push(`Batch error: ${errorMsg}`);
      failed += batch.length;
    }

    // NO DELAYS - maximum speed
  }

  console.log(
    `[Players Import] Completed: ${processed} processed, ${failed} failed`
  );
  return { processed, failed, errors };
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
    console.log(`[Performance] Position ratings took ${ratingsDuration}ms for player ${player.id}`);
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
