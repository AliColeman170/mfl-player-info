import 'server-only';
import { createClient } from '@supabase/supabase-js';
import {
  startSyncExecution,
  completeSyncExecution,
  updateSyncProgress,
  sleep,
  type SyncResult,
} from '../core';
import { getEnhancedMarketDataFromDB } from '@/data/sales';
import { calculateMarketValue } from '@/services/market-value';
import { Player } from '@/types/global.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STAGE_NAME = 'market_values';

export interface MarketValuesOptions {
  batchSize?: number;
  onProgress?: (processed: number, total: number) => void;
}

const DEFAULT_OPTIONS: MarketValuesOptions = {
  batchSize: 100,
};

/**
 * Calculate market values for all players using imported sales data
 */
export async function calculateMarketValues(
  options: MarketValuesOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  console.log('[Market Values] Starting market value calculations...');
  
  const executionId = await startSyncExecution(STAGE_NAME, 'api');
  let totalProcessed = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    // Get all players that need market value calculation
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select(`
        id, overall, age, pace, shooting, passing, dribbling, defense, physical, 
        goalkeeping, primary_position, nationality, first_name, last_name
      `)
      .not('basic_data_synced_at', 'is', null)
      .order('id');

    if (playersError) {
      throw new Error(`Failed to fetch players: ${playersError.message}`);
    }

    const totalPlayers = players?.length || 0;
    console.log(`[Market Values] Found ${totalPlayers} players to process`);

    if (totalPlayers === 0) {
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

    // Process players in batches
    for (let i = 0; i < totalPlayers; i += opts.batchSize!) {
      const batch = players!.slice(i, i + opts.batchSize!);
      
      try {
        console.log(`[Market Values] Processing batch ${Math.floor(i / opts.batchSize!) + 1}/${Math.ceil(totalPlayers / opts.batchSize!)} (${batch.length} players)`);

        const batchResult = await processMarketValueBatch(batch);
        totalProcessed += batchResult.processed;
        totalFailed += batchResult.failed;
        errors.push(...batchResult.errors);

        // Update progress
        await updateSyncProgress(executionId, totalProcessed, totalFailed, {
          batchNumber: Math.floor(i / opts.batchSize!) + 1,
          totalBatches: Math.ceil(totalPlayers / opts.batchSize!),
          currentBatchSize: batch.length,
        });

        // Progress callback
        if (opts.onProgress) {
          opts.onProgress(totalProcessed, totalPlayers);
        }

        // Small delay between batches
        await sleep(500);

      } catch (error) {
        console.error(`[Market Values] Error processing batch ${Math.floor(i / opts.batchSize!) + 1}:`, error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Batch ${Math.floor(i / opts.batchSize!) + 1} failed: ${errorMsg}`);
        totalFailed += batch.length;
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

    console.log(`[Market Values] Completed: processed ${totalProcessed}, failed ${totalFailed}`);

    return {
      success,
      duration,
      recordsProcessed: totalProcessed,
      recordsFailed: totalFailed,
      errors,
      metadata: {
        totalPlayers,
        batchesProcessed: Math.ceil(totalPlayers / opts.batchSize!),
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
 * Process a batch of players for market value calculation
 */
interface PlayerForMarketValue {
  id: number;
  overall: number;
  age: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  goalkeeping: number;
  primary_position: string;
  nationality: string;
  first_name: string;
  last_name: string;
}

async function processMarketValueBatch(
  players: PlayerForMarketValue[]
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Process each player's market value
  for (const player of players) {
    try {
      // Create a Player object compatible with market value calculation
      const playerObj: Player = {
        id: player.id,
        hasPreContract: false,
        energy: 100,
        offerStatus: 0,
        metadata: {
          id: player.id,
          firstName: player.first_name || '',
          lastName: player.last_name || '',
          overall: player.overall || 0,
          age: player.age || 0,
          pace: player.pace || 0,
          shooting: player.shooting || 0,
          passing: player.passing || 0,
          dribbling: player.dribbling || 0,
          defense: player.defense || 0,
          physical: player.physical || 0,
          goalkeeping: player.goalkeeping || 0,
          positions: player.primary_position ? [player.primary_position] : [],
          nationalities: player.nationality ? [player.nationality] : [],
          preferredFoot: '',
          height: 0,
          resistance: 0,
        }
      };

      // Calculate market value using imported sales data
      const marketValueResult = await calculateMarketValue(playerObj);

      // Update player with market value data
      const { error: updateError } = await supabase
        .from('players')
        .update({
          market_value_estimate: marketValueResult.estimatedValue,
          market_value_low: marketValueResult.priceRange.low,
          market_value_high: marketValueResult.priceRange.high,
          market_value_confidence: marketValueResult.confidence,
          market_value_method: marketValueResult.method,
          market_value_sample_size: marketValueResult.sampleSize,
          market_value_based_on: marketValueResult.basedOn,
          market_value_updated_at: new Date().toISOString(),
          market_value_calculated_at: new Date().toISOString(),
          sync_stage: 'market_calculated',
        })
        .eq('id', player.id);

      if (updateError) {
        console.error(`[Market Values] Error updating player ${player.id}:`, updateError);
        errors.push(`Player ${player.id}: ${updateError.message}`);
        failed++;
      } else {
        processed++;
      }

    } catch (error) {
      console.error(`[Market Values] Error calculating market value for player ${player.id}:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Player ${player.id}: ${errorMsg}`);
      failed++;
    }
  }

  return { processed, failed, errors };
}

/**
 * Get market values calculation statistics
 */
export async function getMarketValuesStats() {
  const { data: totalPlayers } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true });

  const { data: playersWithMarketValues } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('market_value_calculated_at', 'is', null);

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
    lastExecution: lastExecution || null,
  };
}