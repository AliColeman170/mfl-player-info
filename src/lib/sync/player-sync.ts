import type { Player } from '@/types/global.types';
import { createClient } from '@supabase/supabase-js';
import {
  createSyncStatus,
  completeSyncStatus,
  isSyncRunning,
  cleanupOldSyncRecords,
} from './sync-status';
import {
  processBatch,
  fetchAllPlayersFromAPI,
  fetchSinglePlayerFromAPI,
  withRetry,
  fetchPlayersFromAPI,
} from './batch-processor';
import { hasPlayerDataChanged } from './computed-fields';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  forceSync?: boolean;
  onProgress?: (processed: number, total: number) => void;
}

export interface SyncResult {
  success: boolean;
  totalPlayers: number;
  processedPlayers: number;
  failedPlayers: number;
  errors: string[];
  duration: number;
}

const DEFAULT_SYNC_OPTIONS: SyncOptions = {
  batchSize: 1500,
  maxRetries: 5,
  retryDelay: 2000,
  forceSync: false,
};

/**
 * Perform full sync of all players
 */
export async function performFullSync(
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };

  console.log('Starting full player sync...');

  // Check if sync is already running
  if (await isSyncRunning()) {
    throw new Error('Sync is already running');
  }

  let syncId: number | null = null;
  let totalPlayers = 0;
  let processedPlayers = 0;
  let failedPlayers = 0;
  const errors: string[] = [];

  try {
    // Check for existing resumable sync
    const existingSync = await getLatestPlayerSync();
    let playerSyncId: number;
    let beforePlayerId: number | undefined;
    let currentPage = 1;

    if (existingSync && existingSync.status === 'running') {
      // Resume existing sync
      console.log(
        `Resuming existing player sync from player ID ${existingSync.last_player_id}`
      );
      playerSyncId = existingSync.id;
      beforePlayerId = existingSync.last_player_id || undefined;
      processedPlayers = existingSync.total_saved;
      currentPage = existingSync.current_page;
    } else {
      // Start new sync
      console.log('Starting new resumable player sync...');
      playerSyncId = await createPlayerSync();
    }

    // Create legacy sync status record for compatibility
    syncId = await createSyncStatus('full', 0);
    console.log(`Created sync status record: ${syncId}`);

    // Fetch and process players page by page
    let hasMore = true;
    const maxPages = 1000; // Safety limit
    let totalFetched = existingSync?.total_fetched || 0;

    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(
          `Fetching page ${currentPage}, beforePlayerId: ${beforePlayerId}`
        );

        // Fetch one page of players
        const playersPage = await withRetry(
          () => fetchPlayersFromAPI(1500, beforePlayerId),
          opts.maxRetries!,
          opts.retryDelay!
        );

        if (!playersPage || playersPage.length === 0) {
          console.log('No more players to fetch');
          hasMore = false;
          break;
        }

        totalFetched += playersPage.length;
        totalPlayers = totalFetched; // Update running total

        // Process page immediately
        const result = await processBatch(
          playersPage,
          syncId,
          { processed: processedPlayers, failed: failedPlayers },
          {
            batchSize: 100, // Internal batch size for processing
            maxRetries: opts.maxRetries!,
            retryDelay: opts.retryDelay!,
            onProgress: opts.onProgress,
          }
        );

        processedPlayers = result.totalProcessed;
        failedPlayers = result.totalFailed;
        errors.push(...result.errors);

        // Update resumable sync metadata with progress
        const lastPlayerId = playersPage[playersPage.length - 1]?.id;
        await updatePlayerSync(playerSyncId, {
          last_player_id: lastPlayerId,
          total_fetched: totalFetched,
          total_saved: processedPlayers,
          current_page: currentPage,
        });

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(processedPlayers, totalFetched);
        }

        // Set up for next page
        beforePlayerId = lastPlayerId;
        currentPage++;

        // Check if we got fewer results than expected (last page)
        if (playersPage.length < 1500) {
          console.log(
            `Received ${playersPage.length} results (less than 1500). Last page reached.`
          );
          hasMore = false;
        }

        console.log(
          `Page ${currentPage - 1} complete: processed ${result.processed}, total processed: ${processedPlayers}`
        );

        // Longer delay between pages to avoid rate limiting
        await sleep(3000);
      } catch (error) {
        console.error(`Error processing page ${currentPage}:`, error);
        errors.push(
          `Page ${currentPage} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );

        // Continue to next page on error, but limit retries
        if (errors.length > 10) {
          console.error('Too many errors, stopping sync');
          break;
        }
        currentPage++;
      }
    }

    // Complete the resumable sync
    await completePlayerSync(
      playerSyncId,
      errors.length === 0 ? 'completed' : 'failed',
      errors.join('; ') || undefined
    );

    console.log(
      `Resumable player sync complete: fetched ${totalFetched}, processed ${processedPlayers}, failed ${failedPlayers}`
    );

    // Complete sync
    const status = errors.length === 0 ? 'completed' : 'failed';
    const errorMessage = errors.length > 0 ? errors.join('; ') : undefined;

    await completeSyncStatus(syncId, status, errorMessage);

    // Cleanup old records
    await cleanupOldSyncRecords();

    const duration = Date.now() - startTime;
    console.log(`Full sync completed in ${duration}ms`);

    return {
      success: errors.length === 0,
      totalPlayers,
      processedPlayers,
      failedPlayers,
      errors,
      duration,
    };
  } catch (error) {
    console.error('Full sync failed:', error);

    if (syncId) {
      await completeSyncStatus(
        syncId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    throw error;
  }
}

/**
 * Sync individual player
 */
export async function syncIndividualPlayer(
  playerId: number,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_SYNC_OPTIONS, ...options };

  console.log(`Starting individual player sync for ${playerId}...`);

  let syncId: number | null = null;
  const errors: string[] = [];

  try {
    // Create sync status record
    syncId = await createSyncStatus('individual', 1);

    // Check if player needs sync (unless forced)
    if (!opts.forceSync) {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('data_hash')
        .eq('id', playerId)
        .single();

      if (existingPlayer) {
        // Fetch current player data to check if changed
        const currentPlayer = await fetchSinglePlayerFromAPI(playerId);

        if (!hasPlayerDataChanged(currentPlayer, existingPlayer.data_hash)) {
          console.log(`Player ${playerId} data unchanged, skipping sync`);
          await completeSyncStatus(syncId, 'completed');

          return {
            success: true,
            totalPlayers: 1,
            processedPlayers: 1,
            failedPlayers: 0,
            errors: [],
            duration: Date.now() - startTime,
          };
        }
      }
    }

    // Fetch player from API
    const player = await withRetry(
      () => fetchSinglePlayerFromAPI(playerId),
      opts.maxRetries!,
      opts.retryDelay!
    );

    // Process single player
    const result = await processBatch(
      [player],
      syncId,
      { processed: 0, failed: 0 },
      {
        batchSize: 1,
        maxRetries: opts.maxRetries!,
        retryDelay: opts.retryDelay!,
        onProgress: opts.onProgress,
      }
    );

    // Complete sync
    const status = result.errors.length === 0 ? 'completed' : 'failed';
    const errorMessage =
      result.errors.length > 0 ? result.errors.join('; ') : undefined;

    await completeSyncStatus(syncId, status, errorMessage);

    const duration = Date.now() - startTime;
    console.log(`Individual player sync completed in ${duration}ms`);

    return {
      success: result.errors.length === 0,
      totalPlayers: 1,
      processedPlayers: result.processed,
      failedPlayers: result.errors.length,
      errors: result.errors,
      duration,
    };
  } catch (error) {
    console.error(`Individual player sync failed for ${playerId}:`, error);

    if (syncId) {
      await completeSyncStatus(
        syncId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    throw error;
  }
}

/**
 * Get sync statistics
 */
export async function getSyncStats() {
  const { data: playerCount } = await supabase
    .from('players')
    .select('id', { count: 'exact' });

  const { data: lastSync } = await supabase
    .from('sync_status')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const { data: runningSyncs } = await supabase
    .from('sync_status')
    .select('*')
    .eq('status', 'running');

  return {
    totalPlayers: playerCount?.length || 0,
    lastSync: lastSync || null,
    isRunning: (runningSyncs?.length || 0) > 0,
    runningSyncs: runningSyncs || [],
  };
}

/**
 * Cancel running sync (mark as failed)
 */
export async function cancelRunningSync(): Promise<void> {
  const { data: runningSyncs } = await supabase
    .from('sync_status')
    .select('id')
    .eq('status', 'running');

  if (runningSyncs && runningSyncs.length > 0) {
    await Promise.all(
      runningSyncs.map((sync) =>
        completeSyncStatus(sync.id, 'failed', 'Cancelled by user')
      )
    );
  }
}

/**
 * Player sync metadata management functions
 */

interface PlayerSyncMetadata {
  id: number;
  sync_type: string;
  last_player_id: number | null;
  total_fetched: number;
  total_saved: number;
  current_page: number;
  status: string;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

async function getLatestPlayerSync(): Promise<PlayerSyncMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('player_sync_metadata')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error getting latest player sync:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting latest player sync:', error);
    return null;
  }
}

async function createPlayerSync(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('player_sync_metadata')
      .insert({
        sync_type: 'full',
        status: 'running',
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log(`Created new player sync with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('Error creating player sync:', error);
    throw error;
  }
}

async function updatePlayerSync(
  syncId: number,
  updates: {
    last_player_id?: number;
    total_fetched?: number;
    total_saved?: number;
    current_page?: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('player_sync_metadata')
      .update(updates)
      .eq('id', syncId);

    if (error) throw error;

    console.log(`Updated player sync ${syncId} with:`, updates);
  } catch (error) {
    console.error(`Error updating player sync ${syncId}:`, error);
    // Don't throw - sync can continue even if metadata update fails
  }
}

async function completePlayerSync(
  syncId: number,
  status: 'completed' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('player_sync_metadata')
      .update({
        status,
        completed_at: new Date().toISOString(),
        error_message: errorMessage || null,
      })
      .eq('id', syncId);

    if (error) throw error;

    console.log(`Completed player sync ${syncId} with status: ${status}`);
  } catch (error) {
    console.error(`Error completing player sync ${syncId}:`, error);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
