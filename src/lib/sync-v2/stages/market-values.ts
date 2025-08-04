import 'server-only';
import { createClient } from '@supabase/supabase-js';
import {
  startSyncExecution,
  completeSyncExecution,
  updateSyncProgress,
  sleep,
  withRetry,
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
  fixZeroValuesOnly?: boolean; // New option to process only players with 0 values
}

const DEFAULT_OPTIONS: MarketValuesOptions = {
  batchSize: 500, // Increased from 100 since we're using local DB
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
    // Pre-load market multipliers from database once for all calculations
    const marketMultipliers = await preloadMarketMultipliers();
    console.log(`[Market Values] Pre-loaded ${Object.keys(marketMultipliers).length} market multipliers from database`);
    
    // Calculate current baseline price from recent sales data
    const baselinePrice = await calculateCurrentBaselinePrice();
    console.log(`[Market Values] Calculated baseline price: $${baselinePrice.toFixed(2)}`);
    
    // First, get total count of players to process
    let countQuery = supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .not('basic_data_synced_at', 'is', null);
    
    // If fixing zero values only, filter for players with 0 market values
    if (opts.fixZeroValuesOnly) {
      countQuery = countQuery
        .eq('market_value_estimate', 0)
        .not('market_value_updated_at', 'is', null); // Only previously processed players
      console.log('[Market Values] Targeting only players with 0 market values...');
    }
    
    const { count: totalPlayers, error: countError } = await countQuery;

    if (countError) {
      throw new Error(`Failed to count players: ${countError.message}`);
    }

    console.log(`[Market Values] Found ${totalPlayers || 0} players to process`);

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

    // Process players in paginated batches
    const pageSize = 1000; // Increased page size for better performance
    let processedTotal = 0;
    let currentOffset = 0;

    while (currentOffset < totalPlayers) {
      // Fetch next batch of players
      let playersQuery = supabase
        .from('players')
        .select(`
          id, overall, age, pace, shooting, passing, dribbling, defense, physical, 
          goalkeeping, primary_position, nationality, first_name, last_name
        `)
        .not('basic_data_synced_at', 'is', null);
      
      // Apply same filter as count query
      if (opts.fixZeroValuesOnly) {
        playersQuery = playersQuery
          .eq('market_value_estimate', 0)
          .not('market_value_updated_at', 'is', null);
      }
      
      const { data: players, error: playersError } = await playersQuery
        .order('id')
        .range(currentOffset, currentOffset + pageSize - 1);

      if (playersError) {
        throw new Error(`Failed to fetch players batch: ${playersError.message}`);
      }

      if (!players || players.length === 0) {
        break; // No more players to process
      }

      console.log(`[Market Values] Processing batch ${Math.floor(currentOffset / pageSize) + 1}: ${players.length} players (${currentOffset + 1}-${currentOffset + players.length} of ${totalPlayers})`);

      // Process this batch in smaller sub-batches
      for (let i = 0; i < players.length; i += opts.batchSize!) {
        const batch = players.slice(i, i + opts.batchSize!);
      
        try {
          console.log(`[Market Values] Processing sub-batch ${Math.floor(i / opts.batchSize!) + 1} of page (${batch.length} players)`);

          const batchResult = await processMarketValueBatch(batch, marketMultipliers, baselinePrice);
          totalProcessed += batchResult.processed;
          totalFailed += batchResult.failed;
          errors.push(...batchResult.errors);

          // Update progress
          await updateSyncProgress(executionId, totalProcessed, totalFailed, {
            currentPage: Math.floor(currentOffset / pageSize) + 1,
            totalProcessed,
            totalPlayers,
            currentBatchSize: batch.length,
          });

          // Progress callback
          if (opts.onProgress) {
            opts.onProgress(totalProcessed, totalPlayers);
          }

          // No delay needed since we're using preloaded data

        } catch (error) {
          console.error(`[Market Values] Error processing sub-batch:`, error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Sub-batch failed: ${errorMsg}`);
          totalFailed += batch.length;
        }
      }

      // Move to next page
      currentOffset += players.length;
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
 * Calculate current baseline price from recent sales data
 * Uses the same logic as market-multiplier-updater.ts
 */
async function calculateCurrentBaselinePrice(): Promise<number> {
  console.log('[Market Values] Calculating baseline price from recent sales...');
  
  // Get recent sales data (last 180 days should be sufficient for baseline)
  const cutoffDate = Date.now() - (180 * 24 * 60 * 60 * 1000);
  
  const { data: recentSales, error } = await supabase
    .from('sales')
    .select('price, player_age, player_overall, player_position')
    .eq('status', 'BOUGHT')
    .gte('price', 1)
    .gte('purchase_date_time', cutoffDate)
    .not('player_age', 'is', null)
    .not('player_overall', 'is', null)
    .not('player_position', 'is', null);

  if (error || !recentSales || recentSales.length === 0) {
    console.warn('Failed to get recent sales for baseline calculation, using fallback');
    return 50; // Fallback baseline price
  }

  console.log(`[Market Values] Analyzing ${recentSales.length} recent sales for baseline`);

  // Use CM, age 25, 76-78 overall as baseline (same as market-multiplier-updater.ts)
  const baselineSales = recentSales.filter(sale => 
    sale.player_position === 'CM' &&
    sale.player_age === 25 &&
    sale.player_overall >= 76 && sale.player_overall <= 78
  );
  
  if (baselineSales.length >= 3) {
    const baselinePrice = baselineSales.reduce((sum, sale) => sum + sale.price, 0) / baselineSales.length;
    console.log(`[Market Values] Found ${baselineSales.length} exact baseline sales, avg: $${baselinePrice.toFixed(2)}`);
    return baselinePrice;
  }
  
  // Broader baseline: CM, ages 24-27, 76-78 overall
  const broaderBaselineSales = recentSales.filter(sale => 
    sale.player_position === 'CM' &&
    sale.player_age >= 24 && sale.player_age <= 27 &&
    sale.player_overall >= 76 && sale.player_overall <= 78
  );
  
  if (broaderBaselineSales.length >= 5) {
    const baselinePrice = broaderBaselineSales.reduce((sum, sale) => sum + sale.price, 0) / broaderBaselineSales.length;
    console.log(`[Market Values] Found ${broaderBaselineSales.length} broader baseline sales, avg: $${baselinePrice.toFixed(2)}`);
    return baselinePrice;
  }
  
  // Fallback: use overall median price
  const allPrices = recentSales.map(s => s.price).sort((a, b) => a - b);
  const medianPrice = allPrices[Math.floor(allPrices.length / 2)];
  console.log(`[Market Values] Using median price from ${allPrices.length} sales: $${medianPrice.toFixed(2)}`);
  return medianPrice;
}

/**
 * Pre-load all market multipliers from database for batch processing
 */
async function preloadMarketMultipliers(): Promise<Record<string, number>> {
  console.log('[Market Values] Pre-loading market multipliers from database...');
  
  const { data: multipliers, error } = await supabase
    .from('market_multipliers')
    .select('position, age_range, overall_range, multiplier');

  if (error) {
    console.error('Failed to preload market multipliers:', error);
    return {};
  }

  // Create lookup map: "position|age|overall" -> multiplier
  const multiplierMap: Record<string, number> = {};
  for (const mult of multipliers || []) {
    const key = `${mult.position}|${mult.age_range}|${mult.overall_range}`;
    multiplierMap[key] = mult.multiplier;
  }
  
  return multiplierMap;
}

/**
 * Get market multiplier from preloaded data with fallback
 */
function getMarketMultiplierFromCache(
  position: string, 
  age: number, 
  overall: number, 
  multiplierCache: Record<string, number>
): number {
  // Convert age and overall to the same ranges used in the database
  const ageRange = age.toString(); // Individual ages 16-40
  const overallRange = getOverallRange(overall);
  
  const key = `${position}|${ageRange}|${overallRange}`;
  const multiplier = multiplierCache[key];
  
  if (multiplier !== undefined) {
    return multiplier;
  }
  
  // Fallback to basic calculation if not in cache
  return getFallbackMultiplier(position, age, overall);
}

/**
 * Helper functions from market-multiplier-updater.ts
 */
function getOverallRange(overall: number): string {
  if (overall >= 97) return '97-99';
  if (overall >= 94) return '94-96';
  if (overall >= 91) return '91-93';
  if (overall >= 88) return '88-90';
  if (overall >= 85) return '85-87';
  if (overall >= 82) return '82-84';
  if (overall >= 79) return '79-81';
  if (overall >= 76) return '76-78';
  if (overall >= 73) return '73-75';
  if (overall >= 70) return '70-72';
  if (overall >= 67) return '67-69';
  if (overall >= 64) return '64-66';
  if (overall >= 61) return '61-63';
  if (overall >= 58) return '58-60';
  if (overall >= 55) return '55-57';
  if (overall >= 52) return '52-54';
  if (overall >= 49) return '49-51';
  if (overall >= 46) return '46-48';
  if (overall >= 43) return '43-45';
  if (overall >= 40) return '40-42';
  return '40-42';
}

function getFallbackMultiplier(position: string, age: number, overall: number): number {
  // Basic fallback based on overall rating (adjusted baseline to 76-78)
  const baseMultiplier = Math.pow(overall / 77, 2);
  
  // Individual age adjustment
  let ageMultiplier: number;
  if (age <= 20) ageMultiplier = 1.50;
  else if (age <= 22) ageMultiplier = 1.30;
  else if (age <= 24) ageMultiplier = 1.10;
  else if (age <= 27) ageMultiplier = 1.00; // BASELINE
  else if (age <= 29) ageMultiplier = 0.85;
  else if (age <= 32) ageMultiplier = 0.65;
  else if (age <= 35) ageMultiplier = 0.45;
  else ageMultiplier = 0.30;
  
  // Position adjustment
  const positionMultipliers: Record<string, number> = {
    'ST': 1.25, 'CF': 1.20, 'CAM': 1.15,
    'CM': 1.00, 'LW': 1.10, 'RW': 1.10, 'LM': 0.95,
    'RM': 0.95, 'CDM': 0.90, 'RB': 0.85, 'LB': 0.85,
    'RWB': 0.80, 'LWB': 0.80, 'CB': 0.75, 'GK': 0.70
  };
  
  const positionMultiplier = positionMultipliers[position] || 1.0;
  
  return Math.max(0.001, baseMultiplier * ageMultiplier * positionMultiplier);
}

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
  players: PlayerForMarketValue[],
  marketMultipliers: Record<string, number>,
  baselinePrice: number
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Process players in parallel chunks using preloaded multipliers
  const PARALLEL_CHUNK_SIZE = 50; // Higher since we're using cached multipliers
  
  for (let i = 0; i < players.length; i += PARALLEL_CHUNK_SIZE) {
    const chunk = players.slice(i, i + PARALLEL_CHUNK_SIZE);
    
    // Calculate market values using cached multipliers (much faster)
    const calculationResults = await Promise.allSettled(
      chunk.map(player => calculatePlayerMarketValueWithCache(player, marketMultipliers, baselinePrice))
    );
    
    // Prepare bulk update data
    const updateData: any[] = [];
    
    for (let j = 0; j < calculationResults.length; j++) {
      const result = calculationResults[j];
      const player = chunk[j];
      
      if (result.status === 'fulfilled') {
        const marketValueResult = result.value;
        
        updateData.push({
          id: player.id,
          market_value_estimate: Math.round(marketValueResult.estimatedValue),
          market_value_low: Math.round(marketValueResult.priceRange.low),
          market_value_high: Math.round(marketValueResult.priceRange.high),
          market_value_confidence: marketValueResult.confidence,
          market_value_method: marketValueResult.method,
          market_value_sample_size: marketValueResult.sampleSize,
          market_value_based_on: marketValueResult.basedOn,
          market_value_updated_at: new Date().toISOString(),
          market_value_calculated_at: new Date().toISOString(),
          sync_stage: 'market_calculated',
        });
      } else {
        failed++;
        errors.push(`Player ${player.id}: ${result.reason}`);
      }
    }
    
    // Bulk update database
    if (updateData.length > 0) {
      try {
        const { error: bulkUpdateError } = await supabase
          .from('players')
          .upsert(updateData, { onConflict: 'id' });
          
        if (bulkUpdateError) {
          failed += updateData.length;
          errors.push(`Bulk update error: ${bulkUpdateError.message}`);
        } else {
          processed += updateData.length;
        }
      } catch (error) {
        failed += updateData.length;
        const errorMsg = error instanceof Error ? error.message : 'Unknown bulk update error';
        errors.push(`Bulk update failed: ${errorMsg}`);
      }
    }
    
    // No delay needed since we're using preloaded data
  }

  return { processed, failed, errors };
}

/**
 * Calculate market value for a single player using cached database multipliers
 */
function calculatePlayerMarketValueWithCache(
  player: PlayerForMarketValue,
  marketMultipliers: Record<string, number>,
  baselinePrice: number
): any {
  // Get the market multiplier for this player from the cache
  const multiplier = getMarketMultiplierFromCache(
    player.primary_position,
    player.age,
    player.overall,
    marketMultipliers
  );
  
  // Calculate estimated value using the multiplier and actual baseline price
  const estimatedValue = Math.round(baselinePrice * multiplier);
  
  // Calculate confidence based on whether we found the multiplier in cache vs fallback
  const key = `${player.primary_position}|${player.age}|${getOverallRange(player.overall)}`;
  const isFromDatabase = marketMultipliers[key] !== undefined;
  const confidence = isFromDatabase ? 'medium' : 'low';
  
  // Calculate price range (±20% for database multipliers, ±30% for fallback)
  const rangePercent = isFromDatabase ? 0.2 : 0.3;
  const priceRange = {
    low: Math.round(estimatedValue * (1 - rangePercent)),
    high: Math.round(estimatedValue * (1 + rangePercent))
  };
  
  return {
    estimatedValue: Math.max(1, estimatedValue),
    priceRange,
    confidence,
    method: isFromDatabase ? 'database-multiplier' : 'fallback-multiplier',
    sampleSize: isFromDatabase ? 1 : 0, // Indicate if from database
    basedOn: isFromDatabase 
      ? `Database multiplier ${multiplier.toFixed(3)} × baseline $${baselinePrice.toFixed(0)}`
      : `Fallback calculation for ${player.primary_position} ${player.age}yo ${player.overall}ovr`
  };
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