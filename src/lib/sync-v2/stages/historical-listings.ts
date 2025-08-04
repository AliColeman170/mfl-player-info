import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Listing } from '@/types/global.types';
import {
  startSyncExecution,
  completeSyncExecution,
  updateSyncProgress,
  withRetry,
  sleep,
  RateLimitError,
  getSyncConfig,
  setSyncConfig,
  getStageInfo,
  importMissingPlayer,
  LISTINGS_API_RATE_LIMIT_DELAY,
  type SyncResult,
} from '../core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGE_NAME = 'listings_historical';

export interface HistoricalListingsOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: HistoricalListingsOptions = {
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * One-time import of all historical listings data
 */
export async function importHistoricalListings(
  options: HistoricalListingsOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log(
    '[Historical Listings] Starting one-time historical listings import...'
  );

  // Check if this stage has already been completed
  const stageInfo = await getStageInfo(STAGE_NAME);
  if (stageInfo?.status === 'completed' && stageInfo.is_one_time) {
    console.log('[Historical Listings] Stage already completed - skipping');
    return {
      success: true,
      duration: 0,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors: [],
      metadata: { skipped: true, reason: 'Already completed' },
    };
  }

  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalFetched = 0;
  let totalUpdatedPlayers = 0;
  let totalFailed = 0;
  const errors: string[] = [];
  let firstListingId: number | null = null;

  try {
    // First, clear all current listing data
    console.log('[Historical Listings] Clearing existing listing data...');
    const { error: clearError } = await supabase
      .from('players')
      .update({
        current_listing_id: null,
        current_listing_price: null,
        current_listing_status: null,
        listing_created_date_time: null,
      })
      .not('current_listing_id', 'is', null);

    if (clearError) {
      console.error(
        '[Historical Listings] Error clearing listing data:',
        clearError
      );
      errors.push(
        `Failed to clear existing listing data: ${clearError.message}`
      );
    }

    // Check for resumable progress
    const lastListingIdStr = await getSyncConfig('last_historical_listing_id');
    let beforeListingId: number | undefined = lastListingIdStr
      ? parseInt(lastListingIdStr)
      : undefined;

    console.log(
      `[Historical Listings] ${beforeListingId ? `Resuming from listing ID ${beforeListingId}` : 'Starting fresh historical import'}`
    );

    let hasMore = true;
    let currentPage = 1;
    const maxPages = 2000; // Safety limit

    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(
          `[Historical Listings] Fetching page ${currentPage}${beforeListingId ? `, beforeListingId: ${beforeListingId}` : ''}`
        );

        // Fetch listings page with retry
        const listingsPage = await withRetry(
          () => fetchHistoricalListingsPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!,
          STAGE_NAME
        );

        if (!listingsPage || listingsPage.length === 0) {
          console.log('[Historical Listings] No more listings to fetch');
          hasMore = false;
          break;
        }

        totalFetched += listingsPage.length;

        // Store the first listing ID we encounter (for future live sync reference)
        if (!firstListingId && listingsPage.length > 0) {
          firstListingId = listingsPage[0].listingResourceId;
          await setSyncConfig('first_listing_id', firstListingId.toString());
        }

        // Process listings batch
        const processingResult = await processListingsBatch(
          listingsPage,
          executionId
        );
        totalUpdatedPlayers += processingResult.updatedPlayers;
        totalFailed += processingResult.failed;
        errors.push(...processingResult.errors);

        // Update progress
        await updateSyncProgress(
          executionId,
          totalUpdatedPlayers,
          totalFailed,
          {
            currentPage,
            totalFetched,
            lastListingId:
              listingsPage[listingsPage.length - 1]?.listingResourceId,
          }
        );

        // Save progress for resumability
        const lastListingId =
          listingsPage[listingsPage.length - 1]?.listingResourceId;
        if (lastListingId) {
          await setSyncConfig(
            'last_historical_listing_id',
            lastListingId.toString()
          );
        }

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalUpdatedPlayers, totalFetched);
        }

        // Check if last page (less than 50 results)
        if (listingsPage.length < 50) {
          console.log(
            `[Historical Listings] Received ${listingsPage.length} results (less than 50). Last page reached.`
          );
          hasMore = false;
        } else {
          beforeListingId = lastListingId;
          currentPage++;
        }

        console.log(
          `[Historical Listings] Page ${currentPage - 1} complete: updated ${processingResult.updatedPlayers} players, total updated: ${totalUpdatedPlayers}`
        );

        // Rate limiting delay for /listings endpoint
        await sleep(LISTINGS_API_RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(
          `[Historical Listings] Error processing page ${currentPage}:`,
          error
        );
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Page ${currentPage} failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 10) {
          console.error(
            '[Historical Listings] Too many errors, stopping import'
          );
          break;
        }
        currentPage++;
      }
    }

    // Mark as completed and cleanup if successful
    const success = errors.length === 0;
    const duration = Date.now() - startTime;

    if (success) {
      // Clear resumable progress since we completed successfully
      // await setSyncConfig('last_historical_listing_id', '');

      // Set the last synced ID for future live syncs
      if (firstListingId) {
        await setSyncConfig(
          'last_listing_id_synced',
          firstListingId.toString()
        );
      }
    }

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(
      `[Historical Listings] Completed: fetched ${totalFetched}, updated ${totalUpdatedPlayers} players, failed ${totalFailed}`
    );

    return {
      success,
      duration,
      recordsProcessed: totalUpdatedPlayers,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalFetched,
        pagesProcessed: currentPage - 1,
        firstListingId,
      },
    };
  } catch (error) {
    console.error('[Historical Listings] Fatal error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    await completeSyncExecution(executionId, 'failed', errorMsg);

    return {
      success: false,
      duration: Date.now() - startTime,
      recordsProcessed: totalUpdatedPlayers,
      recordsFailed: totalFailed,
      errors: [errorMsg, ...errors],
    };
  }
}

/**
 * Fetch historical listings from API
 */
async function fetchHistoricalListingsPage(
  beforeListingId?: number
): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    limit: 50,
    type: 'PLAYER',
    status: 'AVAILABLE',
    marketplace: 'all',
    sorts: 'listing.createdDateTime',
    sortsOrders: 'ASC',
  };

  if (beforeListingId) {
    params.beforeListingId = beforeListingId;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  const baseUrl = 'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod';
  const fullUrl = `${baseUrl}/listings?${queryString}`;

  const response = await fetch(fullUrl);

  if (!response.ok) {
    const errorMessage = `API request failed: ${fullUrl} Error: HTTP ${response.status}: ${response.statusText}`;

    // Handle rate limiting specifically
    if (response.status === 403 || response.status === 429) {
      throw new RateLimitError(errorMessage, response.status);
    }

    throw new Error(errorMessage);
  }

  const listings = await response.json();
  return listings;
}

/**
 * Process listings batch and update player records
 */
async function processListingsBatch(
  listings: Listing[],
  executionId: number
): Promise<{ updatedPlayers: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let updatedPlayers = 0;
  let failed = 0;

  try {
    // Group listings by player ID
    const playerListings = new Map<number, Listing>();

    listings.forEach((listing) => {
      if (listing.player?.id) {
        playerListings.set(listing.player.id, listing);
      }
    });

    console.log(
      `[Historical Listings] Processing ${playerListings.size} unique player listings`
    );

    // Update players in batches
    const batchSize = 100;
    const playerIds = Array.from(playerListings.keys());

    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);

      try {
        // Update players with listing data
        for (const playerId of batch) {
          const listing = playerListings.get(playerId)!;

          const { error } = await supabase
            .from('players')
            .update({
              current_listing_id: listing.listingResourceId,
              current_listing_price: listing.price,
              current_listing_status: listing.status,
              listing_created_date_time: listing.createdDateTime,
            })
            .eq('id', playerId);

          if (error) {
            // Check if it's a foreign key constraint error for missing player
            if (
              error.message.includes('is not present in table "players"') ||
              error.message.includes(`Key (player_id)=(${playerId})`)
            ) {
              console.log(
                `[Historical Listings] Player ${playerId} missing - attempting to import`
              );

              // Import the missing player
              const imported = await importMissingPlayer(playerId);

              if (imported) {
                // Retry the update operation
                const { error: retryError } = await supabase
                  .from('players')
                  .update({
                    current_listing_id: listing.listingResourceId,
                    current_listing_price: listing.price,
                    current_listing_status: listing.status,
                    listing_created_date_time: listing.createdDateTime,
                  })
                  .eq('id', playerId);

                if (retryError) {
                  console.error(
                    `[Historical Listings] Error updating player ${playerId} after import:`,
                    retryError
                  );
                  errors.push(
                    `Failed to update player ${playerId} after import: ${retryError.message}`
                  );
                  failed++;
                } else {
                  updatedPlayers++;
                  console.log(
                    `[Historical Listings] Successfully updated player ${playerId} after importing missing player`
                  );
                }
              } else {
                console.error(
                  `[Historical Listings] Failed to import missing player ${playerId}`
                );
                errors.push(`Failed to import missing player ${playerId}`);
                failed++;
              }
            } else {
              console.error(
                `[Historical Listings] Error updating player ${playerId}:`,
                error
              );
              errors.push(
                `Failed to update player ${playerId}: ${error.message}`
              );
              failed++;
            }
          } else {
            updatedPlayers++;
          }
        }

        console.log(
          `[Historical Listings] Successfully processed batch ${Math.floor(i / batchSize) + 1} (${batch.length} players)`
        );

        // Small delay between batches
        await sleep(100);
      } catch (error) {
        console.error(`[Historical Listings] Error processing batch:`, error);
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown batch error';
        errors.push(`Batch error: ${errorMsg}`);
        failed += batch.length;
      }
    }
  } catch (error) {
    console.error('[Historical Listings] Batch processing error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown batch error';
    errors.push(`Processing error: ${errorMsg}`);
    failed = listings.length;
  }

  return { updatedPlayers, failed, errors };
}

/**
 * Get historical listings import statistics
 */
export async function getHistoricalListingsStats() {
  const { data: playersWithListings } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('current_listing_id', 'is', null);

  const { data: lastExecution } = await supabase
    .from('sync_executions')
    .select('*')
    .eq('stage_name', STAGE_NAME)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const stageInfo = await getStageInfo(STAGE_NAME);

  return {
    playersWithListings: playersWithListings || 0,
    lastExecution: lastExecution || null,
    stageInfo: stageInfo || null,
    isCompleted: stageInfo?.status === 'completed',
  };
}
