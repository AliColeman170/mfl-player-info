import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Listing } from '@/types/global.types';
import { RateLimitError, withRetry } from './batch-processor';
import {
  createSyncStatus,
  completeSyncStatus,
  isSyncRunning,
  cleanupOldSyncRecords,
} from './sync-status';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ListingsSyncResult {
  success: boolean;
  totalListings: number;
  processedListings: number;
  updatedPlayers: number;
  errors: string[];
  duration: number;
}

export interface ListingsSyncOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_LISTINGS_SYNC_OPTIONS: ListingsSyncOptions = {
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Perform full sync of available listings to update player listing data
 */
export async function performListingsSync(
  options: ListingsSyncOptions = {}
): Promise<ListingsSyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_LISTINGS_SYNC_OPTIONS, ...options };

  console.log('Starting listings sync...');

  // Check if sync is already running
  if (await isSyncRunning()) {
    throw new Error('Sync is already running');
  }

  let syncId: number | null = null;
  let totalListings = 0;
  let processedListings = 0;
  let updatedPlayers = 0;
  const errors: string[] = [];

  try {
    // Create sync status record
    syncId = await createSyncStatus('listings', 0);
    console.log(`Created listings sync status record: ${syncId}`);

    // First, clear all current listing data since we'll refresh it
    console.log('Clearing existing listing data...');
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
      console.error('Error clearing listing data:', clearError);
      errors.push(`Failed to clear existing listing data: ${clearError.message}`);
    }

    // Fetch and process listings page by page
    let hasMore = true;
    let currentPage = 1;
    let beforeListingId: number | undefined;
    const maxPages = 2000; // Safety limit

    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(`Fetching listings page ${currentPage}, beforeListingId: ${beforeListingId}`);

        // Fetch one page of listings
        const listingsPage = await withRetry(
          () => fetchListingsPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!
        );

        if (!listingsPage || listingsPage.length === 0) {
          console.log('No more listings to fetch');
          hasMore = false;
          break;
        }

        totalListings += listingsPage.length;

        // Process page immediately
        const result = await processListingsBatch(listingsPage);
        processedListings += result.processedListings;
        updatedPlayers += result.updatedPlayers;
        errors.push(...result.errors);

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(processedListings, totalListings);
        }

        // Set up for next page
        beforeListingId = listingsPage[listingsPage.length - 1]?.listingResourceId;
        currentPage++;

        // Check if we got fewer results than expected (last page)
        if (listingsPage.length < 50) {
          console.log(`Received ${listingsPage.length} results (less than 50). Last page reached.`);
          hasMore = false;
        }

        console.log(`Page ${currentPage - 1} complete: processed ${result.processedListings}, updated ${result.updatedPlayers} players`);

        // Longer delay between pages to avoid rate limiting
        await sleep(3000);

      } catch (error) {
        console.error(`Error processing listings page ${currentPage}:`, error);
        errors.push(`Page ${currentPage} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

        // Continue to next page on error, but limit retries
        if (errors.length > 10) {
          console.error('Too many errors, stopping listings sync');
          break;
        }
        currentPage++;
      }
    }

    console.log(`Listings sync complete: fetched ${totalListings}, processed ${processedListings}, updated ${updatedPlayers} players`);

    // Complete sync
    const status = errors.length === 0 ? 'completed' : 'failed';
    const errorMessage = errors.length > 0 ? errors.join('; ') : undefined;

    await completeSyncStatus(syncId, status, errorMessage);

    // Cleanup old records
    await cleanupOldSyncRecords();

    const duration = Date.now() - startTime;
    console.log(`Listings sync completed in ${duration}ms`);

    return {
      success: errors.length === 0,
      totalListings,
      processedListings,
      updatedPlayers,
      errors,
      duration,
    };

  } catch (error) {
    console.error('Listings sync failed:', error);

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
 * Fetch one page of available listings from MFL API
 */
async function fetchListingsPage(beforeListingId?: number): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    limit: 50,
    type: 'PLAYER',
    status: 'AVAILABLE',
    marketplace: 'all',
  };

  if (beforeListingId) {
    params.beforeListingId = beforeListingId;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  const baseUrl = 'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod';
  const fullUrl = `${baseUrl}/listings?${queryString}`;

  console.log(`Fetching listings page: ${fullUrl}`);

  const response = await fetch(fullUrl);
  if (!response.ok) {
    const errorMessage = `API request failed: ${fullUrl} Error: HTTP ${response.status}: ${response.statusText}`;
    
    // Handle rate limiting specifically
    if (response.status === 403 || response.status === 429) {
      console.warn(`Rate limited (${response.status}), will retry with backoff`);
      throw new RateLimitError(errorMessage, response.status);
    }
    
    throw new Error(errorMessage);
  }

  const listings = await response.json();
  console.log(`Fetched ${listings.length} listings from page`);
  
  return listings;
}

/**
 * Process a batch of listings and update player records
 */
async function processListingsBatch(listings: Listing[]): Promise<{
  processedListings: number;
  updatedPlayers: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let processedListings = 0;
  let updatedPlayers = 0;

  try {
    // Group listings by player ID
    const playerListings = new Map<number, Listing>();
    
    listings.forEach(listing => {
      if (listing.player?.id) {
        playerListings.set(listing.player.id, listing);
      }
    });

    console.log(`Processing ${playerListings.size} unique player listings`);

    // Update players in batches
    const batchSize = 100;
    const playerIds = Array.from(playerListings.keys());
    
    for (let i = 0; i < playerIds.length; i += batchSize) {
      const batch = playerIds.slice(i, i + batchSize);
      
      // Prepare updates for this batch
      const updates = batch.map(playerId => {
        const listing = playerListings.get(playerId)!;
        return {
          id: playerId,
          current_listing_id: listing.listingResourceId,
          current_listing_price: listing.price,
          current_listing_status: listing.status,
          listing_created_date_time: listing.createdDateTime,
        };
      });

      // Update players with listing data
      for (const update of updates) {
        const { error } = await supabase
          .from('players')
          .update({
            current_listing_id: update.current_listing_id,
            current_listing_price: update.current_listing_price,
            current_listing_status: update.current_listing_status,
            listing_created_date_time: update.listing_created_date_time,
          })
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating player ${update.id}:`, error);
          errors.push(`Failed to update player ${update.id}: ${error.message}`);
        } else {
          updatedPlayers++;
        }
      }

      processedListings += batch.length;
      
      // Small delay between batches
      await sleep(100);
    }

    console.log(`Successfully processed ${processedListings} listings, updated ${updatedPlayers} players`);

  } catch (error) {
    console.error('Batch processing error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown batch error');
  }

  return { processedListings, updatedPlayers, errors };
}

/**
 * Get listings sync statistics
 */
export async function getListingsSyncStats() {
  const { data: playersWithListings } = await supabase
    .from('players')
    .select('id', { count: 'exact' })
    .not('current_listing_id', 'is', null);

  const { data: lastSync } = await supabase
    .from('sync_status')
    .select('*')
    .eq('sync_type', 'listings')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return {
    playersWithListings: playersWithListings?.length || 0,
    lastSync: lastSync || null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}