import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Listing } from '@/types/global.types';
import { fetchAllPages } from '@/lib/pagination';
import { RateLimitError, withRetry } from './batch-processor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SalesImportResult {
  success: boolean;
  totalSales: number;
  newSales: number;
  updatedSales: number;
  errors: string[];
  duration: number;
}

export interface SalesImportOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: SalesImportOptions = {
  batchSize: 1000,
  maxRetries: 5,
  retryDelay: 2000,
};

/**
 * Import all sales data from MFL API into local database with resumable sync
 */
export async function importAllSalesData(
  options: SalesImportOptions = {}
): Promise<SalesImportResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  let totalFetched = 0;
  let totalSaved = 0;
  let currentPage = 1;

  console.log('Starting resumable sales data import...');

  try {
    // Check for existing sync to resume
    const existingSync = await getLatestSalesSync();
    let syncId: number;
    let beforeListingId: number | undefined;

    if (existingSync && existingSync.status === 'running') {
      // Resume existing sync
      console.log(`Resuming existing sync from listing ID ${existingSync.last_listing_id}`);
      syncId = existingSync.id;
      beforeListingId = existingSync.last_listing_id || undefined;
      totalFetched = existingSync.total_fetched;
      totalSaved = existingSync.total_saved;
      currentPage = existingSync.current_page;
    } else {
      // Start new sync
      console.log('Starting new sales sync...');
      syncId = await createSalesSync();
    }

    // Fetch and process sales page by page
    let hasMore = true;
    const maxPages = 2000; // Safety limit
    
    while (hasMore && currentPage <= maxPages) {
      try {
        console.log(`Fetching page ${currentPage}, beforeListingId: ${beforeListingId}`);
        
        // Fetch one page of sales with retry logic
        const salesPage = await withRetry(
          () => fetchSalesPage(beforeListingId),
          opts.maxRetries!,
          opts.retryDelay!
        );
        
        if (!salesPage || salesPage.length === 0) {
          console.log('No more sales to fetch');
          hasMore = false;
          break;
        }

        totalFetched += salesPage.length;
        
        // Save page to database immediately
        const saveResult = await processSalesBatch(salesPage);
        totalSaved += saveResult.newSales;
        errors.push(...saveResult.errors);

        // Update sync metadata with progress
        const lastListingId = salesPage[salesPage.length - 1]?.listingResourceId;
        await updateSalesSync(syncId, {
          last_listing_id: lastListingId,
          total_fetched: totalFetched,
          total_saved: totalSaved,
          current_page: currentPage,
        });

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalSaved, totalFetched);
        }

        // Set up for next page
        beforeListingId = lastListingId;
        currentPage++;

        // Check if we got fewer results than expected (last page)
        if (salesPage.length < 50) {
          console.log(`Received ${salesPage.length} results (less than 50). Last page reached.`);
          hasMore = false;
        }

        // Longer delay between pages to avoid rate limiting
        await sleep(3000);

      } catch (error) {
        console.error(`Error processing page ${currentPage}:`, error);
        errors.push(`Page ${currentPage} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Continue to next page on error, but limit retries
        if (errors.length > 10) {
          console.error('Too many errors, stopping sync');
          break;
        }
        currentPage++;
      }
    }

    // Complete the sync
    await completeSalesSync(syncId, errors.length === 0 ? 'completed' : 'failed', errors.join('; ') || undefined);

    const duration = Date.now() - startTime;
    console.log(`Sales import completed in ${duration}ms`);
    console.log(`Total fetched: ${totalFetched}, Total saved: ${totalSaved}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      totalSales: totalFetched,
      newSales: totalSaved,
      updatedSales: 0, // Simplified for now
      errors,
      duration,
    };

  } catch (error) {
    console.error('Sales import failed:', error);
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      totalSales: 0,
      newSales: 0,
      updatedSales: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      duration,
    };
  }
}

/**
 * Fetch one page of sales from MFL API
 */
async function fetchSalesPage(beforeListingId?: number): Promise<Listing[]> {
  const params: Record<string, string | number> = {
    status: 'BOUGHT',
    type: 'PLAYER',
    limit: 50, // Regular listings endpoint supports 50
  };

  if (beforeListingId) {
    params.beforeListingId = beforeListingId;
  }

  const queryString = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ).toString();

  const baseUrl = 'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod';
  const fullUrl = `${baseUrl}/listings?${queryString}`;

  console.log(`Fetching sales page: ${fullUrl}`);

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

  const sales = await response.json();
  console.log(`Fetched ${sales.length} sales from page`);
  
  return sales;
}

/**
 * Process a batch of sales and upsert into database
 */
async function processSalesBatch(sales: Listing[]): Promise<{
  newSales: number;
  updatedSales: number;
  errors: string[];
}> {
  const errors: string[] = [];
  
  // Transform API listings to database format
  const dbRecords = sales.map(sale => ({
    listing_resource_id: sale.listingResourceId,
    player_id: sale.player?.id || 0, // Extract from nested player object
    price: sale.price,
    seller_wallet_address: sale.sellerAddress || null,
    buyer_wallet_address: null, // Not available in regular listings endpoint
    created_date_time: sale.createdDateTime,
    purchase_date_time: sale.purchaseDateTime || null,
    status: sale.status,
    
    // Player metadata for fast filtering (only the fields that exist in DB)
    player_age: sale.player?.metadata?.age || null,
    player_overall: sale.player?.metadata?.overall || null,
    player_position: sale.player?.metadata?.positions?.[0] || null,
  })).filter(record => record.player_id > 0); // Filter out invalid records

  try {
    // Use upsert to handle both new and updated records
    const { error, count } = await supabase
      .from('sales')
      .upsert(dbRecords, { 
        onConflict: 'listing_resource_id',
        count: 'exact'
      });

    if (error) {
      console.error('Database upsert error:', error);
      errors.push(`Database error: ${error.message}`);
      return { newSales: 0, updatedSales: 0, errors };
    }

    // Since we're using upsert, we can't easily distinguish new vs updated
    // For now, we'll count all as "processed"
    const processedCount = count || dbRecords.length;
    
    console.log(`Successfully processed ${processedCount} sales in batch`);
    
    return {
      newSales: processedCount, // Simplified - could be mix of new/updated
      updatedSales: 0,
      errors,
    };

  } catch (error) {
    console.error('Batch processing error:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown batch error');
    
    return { newSales: 0, updatedSales: 0, errors };
  }
}

/**
 * Get sales import statistics
 */
export async function getSalesImportStats() {
  try {
    const { data: salesCount } = await supabase
      .from('sales')
      .select('id', { count: 'exact' });

    const { data: latestSale } = await supabase
      .from('sales')
      .select('imported_at, created_date_time')
      .order('imported_at', { ascending: false })
      .limit(1)
      .single();

    const { data: oldestSale } = await supabase
      .from('sales')
      .select('created_date_time')
      .order('created_date_time', { ascending: true })
      .limit(1)
      .single();

    return {
      totalSales: salesCount?.length || 0,
      latestImport: latestSale?.imported_at || null,
      latestSaleDate: latestSale?.created_date_time || null,
      oldestSaleDate: oldestSale?.created_date_time || null,
    };
  } catch (error) {
    console.error('Error getting sales stats:', error);
    return {
      totalSales: 0,
      latestImport: null,
      latestSaleDate: null,
      oldestSaleDate: null,
    };
  }
}

/**
 * Clean up old sales data (optional maintenance function)
 */
export async function cleanupOldSales(daysToKeep: number = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  try {
    const { count, error } = await supabase
      .from('sales')
      .delete({ count: 'exact' })
      .lt('created_date_time', cutoffDate.getTime());

    if (error) throw error;

    console.log(`Cleaned up ${count} old sales records`);
    return { deletedCount: count || 0 };
  } catch (error) {
    console.error('Error cleaning up old sales:', error);
    throw error;
  }
}

/**
 * Utility functions
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sales sync metadata management functions
 */

interface SalesSyncMetadata {
  id: number;
  sync_type: string;
  last_listing_id: number | null;
  total_fetched: number;
  total_saved: number;
  current_page: number;
  status: string;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
  error_message: string | null;
}

async function getLatestSalesSync(): Promise<SalesSyncMetadata | null> {
  try {
    const { data, error } = await supabase
      .from('sales_sync_metadata')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting latest sales sync:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting latest sales sync:', error);
    return null;
  }
}

async function createSalesSync(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('sales_sync_metadata')
      .insert({
        sync_type: 'full',
        status: 'running',
      })
      .select('id')
      .single();

    if (error) throw error;

    console.log(`Created new sales sync with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('Error creating sales sync:', error);
    throw error;
  }
}

async function updateSalesSync(
  syncId: number, 
  updates: {
    last_listing_id?: number;
    total_fetched?: number;
    total_saved?: number;
    current_page?: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('sales_sync_metadata')
      .update(updates)
      .eq('id', syncId);

    if (error) throw error;

    console.log(`Updated sales sync ${syncId} with:`, updates);
  } catch (error) {
    console.error(`Error updating sales sync ${syncId}:`, error);
    // Don't throw - sync can continue even if metadata update fails
  }
}

async function completeSalesSync(
  syncId: number, 
  status: 'completed' | 'failed', 
  errorMessage?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('sales_sync_metadata')
      .update({
        status,
        completed_at: new Date().toISOString(),
        error_message: errorMessage || null,
      })
      .eq('id', syncId);

    if (error) throw error;

    console.log(`Completed sales sync ${syncId} with status: ${status}`);
  } catch (error) {
    console.error(`Error completing sales sync ${syncId}:`, error);
  }
}