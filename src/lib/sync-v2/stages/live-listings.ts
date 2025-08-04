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
  importMissingPlayer,
  LISTINGS_API_RATE_LIMIT_DELAY,
  type SyncResult,
} from '../core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGE_NAME = 'listings_live';

export interface LiveListingsOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: LiveListingsOptions = {
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Sync current listings data since last sync
 */
export async function syncLiveListings(
  options: LiveListingsOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('[Live Listings] Starting incremental listings sync...');
  
  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalFetched = 0;
  let totalUpdatedPlayers = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Get the last synced listing ID to know where to start
    const lastSyncedIdStr = await getSyncConfig('last_listing_id_synced');
    const lastSyncedId = lastSyncedIdStr ? parseInt(lastSyncedIdStr) : null;
    
    if (!lastSyncedId) {
      console.log('[Live Listings] No last synced ID found - historical import may not be complete');
      // We could still proceed to get all available listings, but warn the user
    }

    console.log(`[Live Listings] Syncing listings since ID: ${lastSyncedId || 'beginning'}`);

    // First, clear existing listing data to ensure we have fresh state
    console.log('[Live Listings] Clearing existing listing data...');
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
      console.error('[Live Listings] Error clearing listing data:', clearError);
      errors.push(`Failed to clear existing listing data: ${clearError.message}`);
    }

    // Use beforeListingId cursor pagination starting from oldest items
    let hasMore = true;
    let beforeListingId: number | null = null;
    let newestListingId: number | null = null;
    const maxPages = 1000; // Higher limit since we're doing full sync

    while (hasMore && maxPages > 0) {
      try {
        console.log(`[Live Listings] Fetching listings page before listing ID: ${beforeListingId || 'start'}`);

        // Fetch listings page with retry
        const listingsPage = await withRetry(
          () => fetchLiveListingsPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!,
          STAGE_NAME
        );

        if (!listingsPage || listingsPage.length === 0) {
          console.log('[Live Listings] No more listings to fetch');
          hasMore = false;
          break;
        }

        // Track the newest listing ID (since we're sorting ASC, the last item is newest)
        if (listingsPage.length > 0) {
          newestListingId = listingsPage[listingsPage.length - 1].listingResourceId;
        }

        // Filter out listings we've already processed if we have a last synced ID
        let newListings = listingsPage;
        if (lastSyncedId) {
          newListings = listingsPage.filter(listing => listing.listingResourceId > lastSyncedId);
          console.log(`[Live Listings] Filtered ${listingsPage.length - newListings.length} already processed listings`);
        }

        totalFetched += newListings.length;

        if (newListings.length > 0) {
          // Process listings batch
          const processingResult = await processListingsBatch(newListings, executionId);
          totalUpdatedPlayers += processingResult.updatedPlayers;
          totalFailed += processingResult.failed;
          errors.push(...processingResult.errors);
        }

        // Update progress
        await updateSyncProgress(executionId, totalUpdatedPlayers, totalFailed, {
          beforeListingId,
          totalFetched,
          listingsInPage: newListings.length,
          lastListingId: listingsPage[listingsPage.length - 1]?.listingResourceId,
        });

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalUpdatedPlayers, totalFetched);
        }

        // Set cursor for next page (last item's ID from current page)
        beforeListingId = listingsPage[listingsPage.length - 1]?.listingResourceId || null;

        // Check if last page (less than 50 results means we've reached the end)
        if (listingsPage.length < 50) {
          console.log(`[Live Listings] Received ${listingsPage.length} results (less than 50). Last page reached.`);
          hasMore = false;
        }

        console.log(`[Live Listings] Page complete: updated ${newListings.length} players, total updated: ${totalUpdatedPlayers}`);

        // Rate limiting delay for /listings endpoint
        await sleep(LISTINGS_API_RATE_LIMIT_DELAY);

      } catch (error) {
        console.error(`[Live Listings] Error processing page:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Page failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 5) {
          console.error('[Live Listings] Too many errors, stopping sync');
          break;
        }
        // Don't increment page since we're using cursor-based pagination
      }
    }

    // Update the last synced ID if we found new listings
    if (newestListingId && totalUpdatedPlayers > 0) {
      await setSyncConfig('last_listing_id_synced', newestListingId.toString());
      console.log(`[Live Listings] Updated last synced listing ID to: ${newestListingId}`);
    }

    // Complete execution
    const success = errors.length === 0;
    const duration = Date.now() - startTime;

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(`[Live Listings] Completed: fetched ${totalFetched} new listings, updated ${totalUpdatedPlayers} players, failed ${totalFailed}`);

    return {
      success,
      duration,
      recordsProcessed: totalUpdatedPlayers,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalFetched,
        newestListingId,
        lastSyncedId,
      },
    };

  } catch (error) {
    console.error('[Live Listings] Fatal error:', error);
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
 * Fetch live listings from API using ascending sort order and beforeListingId pagination
 */
async function fetchLiveListingsPage(beforeListingId?: number | null): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    limit: 50,
    type: 'PLAYER',
    status: 'AVAILABLE',
    marketplace: 'all',
    sorts: 'listing.createdDateTime',
    sortsOrders: 'ASC',
  };

  // Use beforeListingId for cursor pagination
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
 * Process listings batch and update player records (same as historical)
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
    
    listings.forEach(listing => {
      if (listing.player?.id) {
        playerListings.set(listing.player.id, listing);
      }
    });

    console.log(`[Live Listings] Processing ${playerListings.size} unique player listings`);

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
            if (error.message.includes('is not present in table "players"') || error.message.includes(`Key (player_id)=(${playerId})`)) {
              console.log(`[Live Listings] Player ${playerId} missing - attempting to import`);
              
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
                  console.error(`[Live Listings] Error updating player ${playerId} after import:`, retryError);
                  errors.push(`Failed to update player ${playerId} after import: ${retryError.message}`);
                  failed++;
                } else {
                  updatedPlayers++;
                  console.log(`[Live Listings] Successfully updated player ${playerId} after importing missing player`);
                }
              } else {
                console.error(`[Live Listings] Failed to import missing player ${playerId}`);
                errors.push(`Failed to import missing player ${playerId}`);
                failed++;
              }
            } else {
              console.error(`[Live Listings] Error updating player ${playerId}:`, error);
              errors.push(`Failed to update player ${playerId}: ${error.message}`);
              failed++;
            }
          } else {
            updatedPlayers++;
          }
        }

        console.log(`[Live Listings] Successfully processed batch ${Math.floor(i / batchSize) + 1} (${batch.length} players)`);
        
        // Small delay between batches
        await sleep(100);

      } catch (error) {
        console.error(`[Live Listings] Error processing batch:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown batch error';
        errors.push(`Batch error: ${errorMsg}`);
        failed += batch.length;
      }
    }

  } catch (error) {
    console.error('[Live Listings] Batch processing error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown batch error';
    errors.push(`Processing error: ${errorMsg}`);
    failed = listings.length;
  }

  return { updatedPlayers, failed, errors };
}

/**
 * Get live listings sync statistics
 */
export async function getLiveListingsStats() {
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

  const lastSyncedId = await getSyncConfig('last_listing_id_synced');

  return {
    playersWithListings: playersWithListings || 0,
    lastExecution: lastExecution || null,
    lastSyncedId: lastSyncedId ? parseInt(lastSyncedId) : null,
  };
}