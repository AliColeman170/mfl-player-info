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

const STAGE_NAME = 'sales_live';

export interface LiveSalesOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: LiveSalesOptions = {
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Sync new sales data since last sync
 */
export async function syncLiveSales(
  options: LiveSalesOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('[Live Sales] Starting incremental sales sync...');
  
  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalFetched = 0;
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Get the last synced sale ID to know where to start
    const lastSyncedIdStr = await getSyncConfig('last_sale_id_synced');
    const lastSyncedId = lastSyncedIdStr ? parseInt(lastSyncedIdStr) : null;
    
    if (!lastSyncedId) {
      console.log('[Live Sales] No last synced ID found - historical import may not be complete');
      // We could still proceed to get all available sales, but warn the user
    }

    console.log(`[Live Sales] Syncing sales since ID: ${lastSyncedId || 'beginning'}`);

    // Use beforeListingId cursor pagination starting from oldest items
    let hasMore = true;
    let beforeListingId: number | null = null;
    let newestSaleId: number | null = null;
    const maxPages = 1000; // Higher limit since we're doing full historical sync

    while (hasMore && maxPages > 0) {
      try {
        console.log(`[Live Sales] Fetching sales page before listing ID: ${beforeListingId || 'start'}`);

        // Fetch sales page with retry
        const salesPage = await withRetry(
          () => fetchLiveSalesPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!,
          STAGE_NAME
        );

        if (!salesPage || salesPage.length === 0) {
          console.log('[Live Sales] No more sales to fetch');
          hasMore = false;
          break;
        }

        // Track the newest sale ID (since we're sorting ASC, the last item is newest)
        if (salesPage.length > 0) {
          newestSaleId = salesPage[salesPage.length - 1].listingResourceId;
        }

        // Filter out sales we've already processed if we have a last synced ID
        let newSales = salesPage;
        if (lastSyncedId) {
          newSales = salesPage.filter(sale => sale.listingResourceId > lastSyncedId);
          console.log(`[Live Sales] Filtered ${salesPage.length - newSales.length} already processed sales`);
        }

        totalFetched += newSales.length;

        if (newSales.length > 0) {
          // Process sales batch
          const processingResult = await processSalesBatch(newSales, executionId);
          totalProcessed += processingResult.processed;
          totalFailed += processingResult.failed;
          errors.push(...processingResult.errors);
        }

        // Update progress
        await updateSyncProgress(executionId, totalProcessed, totalFailed, {
          beforeListingId,
          totalFetched,
          salesInPage: newSales.length,
          lastListingId: salesPage[salesPage.length - 1]?.listingResourceId,
        });

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalProcessed, totalFetched);
        }

        // Set cursor for next page (last item's ID from current page)
        beforeListingId = salesPage[salesPage.length - 1]?.listingResourceId || null;

        // Check if last page (less than 50 results means we've reached the end)
        if (salesPage.length < 50) {
          console.log(`[Live Sales] Received ${salesPage.length} results (less than 50). Last page reached.`);
          hasMore = false;
        }

        console.log(`[Live Sales] Page complete: processed ${newSales.length} new sales, total processed: ${totalProcessed}`);

        // Rate limiting delay for /listings endpoint
        await sleep(LISTINGS_API_RATE_LIMIT_DELAY);

      } catch (error) {
        console.error(`[Live Sales] Error processing page:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Page failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 5) {
          console.error('[Live Sales] Too many errors, stopping sync');
          break;
        }
        // Don't increment page since we're using cursor-based pagination
      }
    }

    // Update the last synced ID if we found new sales
    if (newestSaleId && totalProcessed > 0) {
      await setSyncConfig('last_sale_id_synced', newestSaleId.toString());
      console.log(`[Live Sales] Updated last synced sale ID to: ${newestSaleId}`);
    }

    // Complete execution
    const success = errors.length === 0;
    const duration = Date.now() - startTime;

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(`[Live Sales] Completed: fetched ${totalFetched} new sales, processed ${totalProcessed}, failed ${totalFailed}`);

    return {
      success,
      duration,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalFetched,
        newestSaleId,
        lastSyncedId,
      },
    };

  } catch (error) {
    console.error('[Live Sales] Fatal error:', error);
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
 * Fetch live sales from API using ascending sort order and beforeListingId pagination
 */
async function fetchLiveSalesPage(beforeListingId?: number | null): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    status: 'BOUGHT',
    type: 'PLAYER',
    limit: 50,
    sorts: 'listing.createdDateTime',
    sortsOrders: 'ASC',
  };

  // Use beforeListingId for pagination to get older records
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
  
  const sales = await response.json();
  return sales;
}

/**
 * Process sales batch and store in database (same as historical)
 */
async function processSalesBatch(
  sales: Listing[],
  _executionId: number
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  try {
    // Transform API listings to database format
    const dbRecords = sales.map(sale => ({
      listing_resource_id: sale.listingResourceId,
      player_id: sale.player?.id || 0,
      price: sale.price,
      seller_wallet_address: sale.sellerAddress || null,
      buyer_wallet_address: null, // Not available in regular listings endpoint
      created_date_time: sale.createdDateTime,
      purchase_date_time: sale.purchaseDateTime || null,
      status: sale.status,
      
      // Player metadata for fast filtering
      player_age: sale.player?.metadata?.age || null,
      player_overall: sale.player?.metadata?.overall || null,
      player_position: sale.player?.metadata?.positions?.[0] || null,
    })).filter(record => record.player_id > 0);

    if (dbRecords.length === 0) {
      console.log('[Live Sales] No valid records in batch - skipping');
      return { processed: 0, failed: sales.length, errors: ['No valid player IDs in batch'] };
    }

    // Use upsert to handle both new and duplicate records
    const { error, count } = await supabase
      .from('sales')
      .upsert(dbRecords, { 
        onConflict: 'listing_resource_id',
        count: 'exact'
      });

    if (error) {
      // Check if it's a foreign key constraint error for missing player
      if (error.code === '23503') {
        console.log('[Live Sales] Foreign key constraint error - attempting to import missing players');
        
        // Find all missing players by checking which ones exist in the database
        const missingPlayerIds = new Set<number>();
        const uniquePlayerIds = [...new Set(dbRecords.map(record => record.player_id).filter(id => id > 0))];
        
        console.log(`[Live Sales] Checking existence of ${uniquePlayerIds.length} unique players in batch`);
        
        // Check which players exist in the database
        const { data: existingPlayers } = await supabase
          .from('players')
          .select('id')
          .in('id', uniquePlayerIds);
        
        const existingPlayerIds = new Set(existingPlayers?.map(p => p.id) || []);
        
        // Find missing players
        uniquePlayerIds.forEach(playerId => {
          if (!existingPlayerIds.has(playerId)) {
            missingPlayerIds.add(playerId);
          }
        });
        
        console.log(`[Live Sales] Found ${missingPlayerIds.size} missing players: [${Array.from(missingPlayerIds).join(', ')}]`);
        
        // Import missing players
        let importedCount = 0;
        for (const playerId of missingPlayerIds) {
          console.log(`[Live Sales] Attempting to import missing player ${playerId}`);
          const imported = await importMissingPlayer(playerId);
          if (imported) {
            importedCount++;
          }
        }
        
        if (importedCount > 0) {
          console.log(`[Live Sales] Imported ${importedCount} missing players, retrying batch`);
          
          // Retry the upsert operation
          const { error: retryError, count: retryCount } = await supabase
            .from('sales')
            .upsert(dbRecords, { 
              onConflict: 'listing_resource_id',
              count: 'exact'
            });
          
          if (retryError) {
            console.error('[Live Sales] Database upsert error on retry:', retryError);
            errors.push(`Database error (after player import): ${retryError.message}`);
            failed = sales.length;
          } else {
            processed = retryCount || dbRecords.length;
            console.log(`[Live Sales] Successfully processed ${processed} sales in batch after importing missing players`);
          }
        } else {
          console.error('[Live Sales] Failed to import missing players');
          errors.push(`Database error (missing players): ${error.message}`);
          failed = sales.length;
        }
      } else {
        console.error('[Live Sales] Database upsert error:', error);
        errors.push(`Database error: ${error.message}`);
        failed = sales.length;
      }
    } else {
      processed = count || dbRecords.length;
      console.log(`[Live Sales] Successfully processed ${processed} sales in batch`);
    }

  } catch (error) {
    console.error('[Live Sales] Batch processing error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown batch error';
    errors.push(`Batch error: ${errorMsg}`);
    failed = sales.length;
  }

  return { processed, failed, errors };
}

/**
 * Get live sales sync statistics
 */
export async function getLiveSalesStats() {
  const { data: totalSales } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true });

  const { data: lastExecution } = await supabase
    .from('sync_executions')
    .select('*')
    .eq('stage_name', STAGE_NAME)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  const lastSyncedId = await getSyncConfig('last_sale_id_synced');

  return {
    totalSales: totalSales || 0,
    lastExecution: lastExecution || null,
    lastSyncedId: lastSyncedId ? parseInt(lastSyncedId) : null,
  };
}