import 'server-only';
import { createClient } from '@supabase/supabase-js';
import {
  startSyncExecution,
  completeSyncExecution,
  updateSyncProgress,
  type SyncResult,
} from '../core';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGE_NAME = 'market_values';

export interface MarketValuesOptions {
  batchSize?: number;
  onProgress?: (processed: number, total: number, totalPlayers: number) => void;
  skipSummaryRefresh?: boolean; // For testing or when summary is already fresh
}

const DEFAULT_OPTIONS: MarketValuesOptions = {
  batchSize: 5000, // Large batch size for ultra-fast bulk SQL operations
  skipSummaryRefresh: false, // Set to true for testing without refresh
};

/**
 * Calculate market values for all players using the new comprehensive pricing system
 */
export async function calculateMarketValues(
  options: MarketValuesOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('[Market Values] Starting comprehensive market value calculations...');
  
  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    let summaryResult = 0;
    
    // Optionally refresh the sales summary with latest sales data
    if (!opts.skipSummaryRefresh) {
      console.log('[Market Values] Refreshing sales summary with latest sales data...');
      const { data: result, error: summaryError } = await supabase
        .rpc('update_sales_summary');
      
      if (summaryError) {
        throw new Error(`Failed to refresh sales summary: ${summaryError.message}`);
      }
      
      summaryResult = result || 0;
      console.log(`[Market Values] Sales summary refreshed: ${summaryResult} combinations updated`);
    } else {
      console.log('[Market Values] Skipping sales summary refresh (using existing data)');
    }
    
    // Get total count of players to process
    const { count: totalPlayers, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .not('overall', 'is', null);

    if (countError) {
      throw new Error(`Failed to count players: ${countError.message}`);
    }

    console.log(`[Market Values] Found ${totalPlayers || 0} players to process using comprehensive pricing model`);

    if (!totalPlayers || totalPlayers === 0) {
      await completeSyncExecution(executionId, 'completed');
      return {
        success: true,
        duration: Date.now() - startTime,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: [],
        metadata: { totalPlayers: 0 },
      };
    }

    // Process players in batches using the new database function
    let currentOffset = 0;
    const batchSize = opts.batchSize!;

    while (currentOffset < totalPlayers) {
      try {
        console.log(`[Market Values] Processing batch starting at offset ${currentOffset} (batch size: ${batchSize})`);

        // Call the new batch processing function
        const { data: batchResults, error: batchError } = await supabase
          .rpc('update_players_market_values_batch', {
            batch_size: batchSize,
            offset_val: currentOffset
          });

        if (batchError) {
          throw new Error(`Batch processing error: ${batchError.message}`);
        }

        const result = batchResults[0];
        const { processed_count, updated_count, error_count } = result;

        totalProcessed += updated_count;
        totalFailed += error_count;

        // Update progress
        await updateSyncProgress(executionId, totalProcessed, totalFailed, {
          currentOffset,
          totalPlayers,
          currentBatchProcessed: processed_count,
          currentBatchUpdated: updated_count,
          currentBatchErrors: error_count,
          salesSummaryRefreshed: true,
        });

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalProcessed, totalFailed, totalPlayers);
        }

        console.log(`[Market Values] Batch complete: processed ${processed_count}, updated ${updated_count}, errors ${error_count}`);

        // If we processed fewer players than the batch size, we're done
        if (processed_count < batchSize) {
          console.log(`[Market Values] Processed ${processed_count} < ${batchSize}, reached end of players`);
          break;
        }

        currentOffset += processed_count;

        // Short delay between batches with the optimized bulk function
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[Market Values] Error processing batch at offset ${currentOffset}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Batch at offset ${currentOffset} failed: ${errorMsg}`);
        totalFailed += batchSize; // Assume the whole batch failed
        
        // Move to next batch to continue processing
        currentOffset += batchSize;
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

    console.log(`[Market Values] Comprehensive pricing completed: processed ${totalProcessed}, failed ${totalFailed}`);

    return {
      success,
      duration,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalPlayers,
        batchesProcessed: Math.ceil(totalPlayers / batchSize),
        usingComprehensivePricing: true,
        salesSummaryCombinations: summaryResult || 0,
        salesSummaryRefreshed: true,
      },
    };

  } catch (error) {
    console.error('[Market Values] Fatal error:', error);
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
 * Get market values calculation statistics
 */
export async function getMarketValuesStats() {
  const { data: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('overall', 'is', null);

  const { data: playersWithMarketValues } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('market_value_updated_at', 'is', null);

  const { data: playersWithComprehensivePricing } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .like('market_value_method', 'Data-driven%');

  const { data: lastExecution } = await supabase
    .from('sync_executions')
    .select('*')
    .eq('stage_name', STAGE_NAME)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  return {
    totalPlayers: totalPlayers || 0,
    playersWithMarketValues: playersWithMarketValues || 0,
    playersWithComprehensivePricing: playersWithComprehensivePricing || 0,
    lastExecution: lastExecution || null,
  };
}