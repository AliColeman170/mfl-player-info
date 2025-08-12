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
  importMissingPlayer,
  LISTINGS_API_RATE_LIMIT_DELAY,
  type SyncResult,
} from '../core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGE_NAME = 'sales';

export interface SalesOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: SalesOptions = {
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Sync all sales data from MFL API
 * Automatically handles both initial import and incremental updates
 * Uses most recent sale in database as cursor (or starts from beginning if none)
 */
export async function syncSales(
  options: SalesOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('[Sales] Starting sales sync...');

  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalFetched = 0;
  let salesProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];
  let firstSaleId: number | null = null;
  let newestSaleId: number | null = null;

  try {
    // Get cursor from most recent sale in database
    const lastListingId = await getLastSaleCursor();

    if (!lastListingId) {
      console.log('[Sales] No previous sales found - starting complete import');
    } else {
      console.log(`[Sales] Syncing sales since ID: ${lastListingId}`);
    }

    // Fetch all sales since cursor using chronological order  
    let hasMore = true;
    let beforeListingId: number | null = lastListingId;
    let currentPage = 1;
    const maxPages = 100000; // High limit for complete imports

    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(
          `[Sales] Fetching page ${currentPage}${beforeListingId ? `, before ID: ${beforeListingId}` : ''}`
        );

        // Fetch sales page with retry
        const salesPage = await withRetry(
          () => fetchSalesPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!,
          STAGE_NAME
        );

        if (!salesPage || salesPage.length === 0) {
          console.log('[Sales] No more sales to fetch');
          hasMore = false;
          break;
        }

        // Track first and newest sale IDs
        if (!firstSaleId && salesPage.length > 0) {
          firstSaleId = salesPage[0].listingResourceId;
        }
        if (salesPage.length > 0) {
          newestSaleId = salesPage[salesPage.length - 1].listingResourceId;
        }

        totalFetched += salesPage.length;

        // Process sales batch
        const processingResult = await processSalesData(salesPage);
        salesProcessed += processingResult.salesProcessed;
        totalFailed += processingResult.failed;
        errors.push(...processingResult.errors);

        // Update progress
        await updateSyncProgress(executionId, salesProcessed, totalFailed, {
          currentPage,
          totalFetched,
          lastListingId: newestSaleId,
        });

        // Progress is automatically tracked via database - no config needed

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(salesProcessed, totalFetched);
        }

        // Check if last page
        if (salesPage.length < 50) {
          console.log(
            `[Sales] Received ${salesPage.length} results (less than 50). Last page reached.`
          );
          hasMore = false;
        } else {
          beforeListingId = newestSaleId;
          currentPage++;
        }

        console.log(
          `[Sales] Page ${currentPage - 1} complete: ${salesPage.length} sales processed`
        );
        console.log(`[Sales] Running totals - Sales: ${salesProcessed}`);

        // Rate limiting delay
        await sleep(LISTINGS_API_RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(`[Sales] Error processing page ${currentPage}:`, error);
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Page ${currentPage} failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 10) {
          console.error('[Sales] Too many errors, stopping sync');
          break;
        }
        currentPage++;
      }
    }

    // Complete execution
    const success = errors.length === 0;
    const duration = Date.now() - startTime;

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(
      `[Sales] Completed: ${totalFetched} sales fetched, ${salesProcessed} sales processed, ${totalFailed} failed`
    );

    return {
      success,
      duration,
      recordsProcessed: salesProcessed,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalFetched,
        pagesProcessed: currentPage - 1,
        firstSaleId,
        newestSaleId,
        lastListingId,
      },
    };
  } catch (error) {
    console.error('[Sales] Fatal error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    await completeSyncExecution(executionId, 'failed', errorMsg);

    return {
      success: false,
      duration: Date.now() - startTime,
      recordsProcessed: salesProcessed,
      recordsFailed: totalFailed,
      errors: [errorMsg, ...errors],
    };
  }
}

/**
 * Get cursor from most recent sale in database
 * Returns null if no sales exist (triggers complete import)
 */
async function getLastSaleCursor(): Promise<number | null> {
  const { data: lastSale } = await supabase
    .from('sales')
    .select('listing_resource_id')
    .order('purchase_date_time', { ascending: false })
    .limit(1)
    .single();
  
  return lastSale?.listing_resource_id || null;
}

/**
 * Fetch sales (BOUGHT listings) from MFL API since cursor
 */
async function fetchSalesPage(
  beforeListingId?: number | null
): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    limit: 50,
    type: 'PLAYER',
    status: 'BOUGHT', // Filter MFL /listings for sales only
    marketplace: 'all',
    sorts: 'listing.purchaseDateTime', // MFL API sort field
    sortsOrders: 'ASC', // Chronological order
  };

  // Use beforeListingId for cursor pagination (MFL API parameter)
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
 * Process sales data batch
 */
async function processSalesData(
  sales: Listing[]
): Promise<{
  salesProcessed: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let salesProcessed = 0;
  let failed = 0;

  console.log(
    `[Sales] Processing ${sales.length} sales`
  );

  try {
    // Transform API listings to database format
    const dbRecords = sales
      .map((sale) => ({
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
      }))
      .filter((record) => record.player_id > 0);

    if (dbRecords.length === 0) {
      console.log('[Sales] No valid records in batch - skipping');
      return {
        salesProcessed: 0,
        failed: sales.length,
        errors: ['No valid player IDs in batch'],
      };
    }

    // Use batch upsert for better performance
    const { error, count } = await supabase.from('sales').upsert(dbRecords, {
      onConflict: 'listing_resource_id',
      count: 'exact',
    });

    if (error) {
      // Handle foreign key constraint error for missing players
      if (error.code === '23503') {
        console.log(
          '[Sales] Foreign key constraint error - importing missing players'
        );

        // Find missing players
        const uniquePlayerIds = [...new Set(dbRecords.map(record => record.player_id).filter(id => id > 0))];
        const { data: existingPlayers } = await supabase
          .from('players')
          .select('id')
          .in('id', uniquePlayerIds);
        
        const existingPlayerIds = new Set(existingPlayers?.map(p => p.id) || []);
        const missingPlayerIds = uniquePlayerIds.filter(id => !existingPlayerIds.has(id));
        
        console.log(`[Sales] Found ${missingPlayerIds.length} missing players`);

        // Import missing players
        let importedCount = 0;
        for (const playerId of missingPlayerIds) {
          const imported = await importMissingPlayer(playerId);
          if (imported) importedCount++;
        }

        if (importedCount > 0) {
          console.log(`[Sales] Imported ${importedCount} missing players, retrying`);
          
          // Retry the upsert operation
          const { error: retryError, count: retryCount } = await supabase
            .from('sales')
            .upsert(dbRecords, {
              onConflict: 'listing_resource_id',
              count: 'exact',
            });

          if (retryError) {
            console.error('[Sales] Database upsert error on retry:', retryError);
            errors.push(`Database error (after player import): ${retryError.message}`);
            failed = sales.length;
          } else {
            salesProcessed = retryCount || dbRecords.length;
            console.log(`[Sales] Successfully processed ${salesProcessed} sales after importing missing players`);
          }
        } else {
          console.error('[Sales] Failed to import missing players');
          errors.push(`Database error (missing players): ${error.message}`);
          failed = sales.length;
        }
      } else {
        console.error('[Sales] Database upsert error:', error);
        errors.push(`Database error: ${error.message}`);
        failed = sales.length;
      }
    } else {
      salesProcessed = count || dbRecords.length;
      console.log(`[Sales] Successfully processed ${salesProcessed} sales in batch`);
    }
  } catch (error) {
    console.error('[Sales] Batch processing error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown batch error';
    errors.push(`Batch error: ${errorMsg}`);
    failed = sales.length;
  }

  return { salesProcessed, failed, errors };
}


/**
 * Get sales sync statistics
 */
export async function getSalesStats() {
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

  const lastSaleCursor = await getLastSaleCursor();

  return {
    totalSales: totalSales || 0,
    lastExecution: lastExecution || null,
    lastSaleCursor,
  };
}
