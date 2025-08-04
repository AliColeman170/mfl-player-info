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

const STAGE_NAME = 'sales_historical';

export interface HistoricalSalesOptions {
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: HistoricalSalesOptions = {
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * One-time import of all historical sales data
 */
export async function importHistoricalSales(
  options: HistoricalSalesOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log(
    '[Historical Sales] Starting one-time historical sales import...'
  );

  // Check if this stage has already been completed
  const stageInfo = await getStageInfo(STAGE_NAME);
  if (stageInfo?.status === 'completed' && stageInfo.is_one_time) {
    console.log('[Historical Sales] Stage already completed - skipping');
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
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];
  let firstSaleId: number | null = null;

  try {
    // Check for resumable progress
    const lastSaleIdStr = await getSyncConfig('last_historical_sale_id');
    let beforeListingId: number | undefined = lastSaleIdStr
      ? parseInt(lastSaleIdStr)
      : undefined;

    console.log(
      `[Historical Sales] ${beforeListingId ? `Resuming from listing ID ${beforeListingId}` : 'Starting fresh historical import'}`
    );

    let hasMore = true;
    let currentPage = 1;
    const maxPages = 100000; // Safety limit for historical data

    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(
          `[Historical Sales] Fetching page ${currentPage}${beforeListingId ? `, beforeListingId: ${beforeListingId}` : ''}`
        );

        // Fetch sales page with retry
        const salesPage = await withRetry(
          () => fetchHistoricalSalesPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!,
          STAGE_NAME
        );

        if (!salesPage || salesPage.length === 0) {
          console.log('[Historical Sales] No more sales to fetch');
          hasMore = false;
          break;
        }

        totalFetched += salesPage.length;

        // Store the first sale ID we encounter (for future live sync reference)
        if (!firstSaleId && salesPage.length > 0) {
          firstSaleId = salesPage[0].listingResourceId;
          await setSyncConfig('first_sale_id', firstSaleId.toString());
        }

        // Process sales batch
        const processingResult = await processSalesBatch(
          salesPage,
          executionId
        );
        totalProcessed += processingResult.processed;
        totalFailed += processingResult.failed;
        errors.push(...processingResult.errors);

        // Update progress
        await updateSyncProgress(executionId, totalProcessed, totalFailed, {
          currentPage,
          totalFetched,
          lastListingId: salesPage[salesPage.length - 1]?.listingResourceId,
        });

        // Save progress for resumability
        const lastListingId =
          salesPage[salesPage.length - 1]?.listingResourceId;
        if (lastListingId) {
          await setSyncConfig(
            'last_historical_sale_id',
            lastListingId.toString()
          );
        }

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalProcessed, totalFetched);
        }

        // Check if last page (less than 50 results)
        if (salesPage.length < 50) {
          console.log(
            `[Historical Sales] Received ${salesPage.length} results (less than 50). Last page reached.`
          );
          hasMore = false;
        } else {
          beforeListingId = lastListingId;
          currentPage++;
        }

        console.log(
          `[Historical Sales] Page ${currentPage - 1} complete: processed ${processingResult.processed}, total processed: ${totalProcessed}`
        );

        // Rate limiting delay for /listings endpoint
        await sleep(LISTINGS_API_RATE_LIMIT_DELAY);
      } catch (error) {
        console.error(
          `[Historical Sales] Error processing page ${currentPage}:`,
          error
        );
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Page ${currentPage} failed: ${errorMsg}`);

        // Continue to next page on error, but limit consecutive failures
        if (errors.length > 10) {
          console.error('[Historical Sales] Too many errors, stopping import');
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
      await setSyncConfig('last_historical_sale_id', '');

      // Set the last synced ID for future live syncs
      if (firstSaleId) {
        await setSyncConfig('last_sale_id_synced', firstSaleId.toString());
      }
    }

    await completeSyncExecution(
      executionId,
      success ? 'completed' : 'failed',
      errors.length > 0 ? errors.slice(0, 5).join('; ') : undefined
    );

    console.log(
      `[Historical Sales] Completed: fetched ${totalFetched}, processed ${totalProcessed}, failed ${totalFailed}`
    );

    return {
      success,
      duration,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalFetched,
        pagesProcessed: currentPage - 1,
        firstSaleId,
      },
    };
  } catch (error) {
    console.error('[Historical Sales] Fatal error:', error);
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
 * Fetch historical sales from API
 */
async function fetchHistoricalSalesPage(
  beforeListingId?: number
): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    status: 'BOUGHT',
    type: 'PLAYER',
    limit: 50,
    sorts: 'listing.purchaseDateTime',
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

  const sales = await response.json();
  return sales;
}

/**
 * Process sales batch and store in database
 */
async function processSalesBatch(
  sales: Listing[],
  executionId: number
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  try {
    // Transform API listings to database format
    const dbRecords = sales
      .map((sale) => ({
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
      }))
      .filter((record) => record.player_id > 0);

    if (dbRecords.length === 0) {
      console.log('[Historical Sales] No valid records in batch - skipping');
      return {
        processed: 0,
        failed: sales.length,
        errors: ['No valid player IDs in batch'],
      };
    }

    // Use upsert to handle both new and duplicate records
    const { error, count } = await supabase.from('sales').upsert(dbRecords, {
      onConflict: 'listing_resource_id',
      count: 'exact',
    });

    if (error) {
      // Check if it's a foreign key constraint error for missing player
      if (error.code === '23503') {
        console.log(
          '[Historical Sales] Foreign key constraint error - attempting to import missing players'
        );

        // Find all missing players by checking which ones exist in the database
        const missingPlayerIds = new Set<number>();
        const uniquePlayerIds = [...new Set(dbRecords.map(record => record.player_id).filter(id => id > 0))];
        
        console.log(`[Historical Sales] Checking existence of ${uniquePlayerIds.length} unique players in batch`);
        
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
        
        console.log(`[Historical Sales] Found ${missingPlayerIds.size} missing players: [${Array.from(missingPlayerIds).join(', ')}]`);

        // Import missing players
        let importedCount = 0;
        for (const playerId of missingPlayerIds) {
          console.log(
            `[Historical Sales] Attempting to import missing player ${playerId}`
          );
          const imported = await importMissingPlayer(playerId);
          if (imported) {
            importedCount++;
          }
        }

        if (importedCount > 0) {
          console.log(
            `[Historical Sales] Imported ${importedCount} missing players, retrying batch`
          );

          // Retry the upsert operation
          const { error: retryError, count: retryCount } = await supabase
            .from('sales')
            .upsert(dbRecords, {
              onConflict: 'listing_resource_id',
              count: 'exact',
            });

          if (retryError) {
            console.error(
              '[Historical Sales] Database upsert error on retry:',
              retryError
            );
            errors.push(
              `Database error (after player import): ${retryError.message}`
            );
            failed = sales.length;
          } else {
            processed = retryCount || dbRecords.length;
            console.log(
              `[Historical Sales] Successfully processed ${processed} sales in batch after importing missing players`
            );
          }
        } else {
          console.error('[Historical Sales] Failed to import missing players');
          errors.push(`Database error (missing players): ${error.message}`);
          failed = sales.length;
        }
      } else {
        console.error('[Historical Sales] Database upsert error:', error);
        errors.push(`Database error: ${error.message}`);
        failed = sales.length;
      }
    } else {
      processed = count || dbRecords.length;
      console.log(
        `[Historical Sales] Successfully processed ${processed} sales in batch`
      );
    }
  } catch (error) {
    console.error('[Historical Sales] Batch processing error:', error);
    const errorMsg =
      error instanceof Error ? error.message : 'Unknown batch error';
    errors.push(`Batch error: ${errorMsg}`);
    failed = sales.length;
  }

  return { processed, failed, errors };
}

/**
 * Get historical sales import statistics
 */
export async function getHistoricalSalesStats() {
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

  const stageInfo = await getStageInfo(STAGE_NAME);

  return {
    totalSales: totalSales || 0,
    lastExecution: lastExecution || null,
    stageInfo: stageInfo || null,
    isCompleted: stageInfo?.status === 'completed',
  };
}
