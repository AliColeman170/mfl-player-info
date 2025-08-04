/**
 * Market Multiplier Updater Service
 * 
 * This service manages dynamic market multipliers that replace the hardcoded 
 * REAL_MARKET_MULTIPLIERS in market-value.ts. It analyzes fresh sales data
 * to calculate Age × Position × Overall rating multipliers for market valuation.
 * 
 * Key features:
 * - Periodic recalculation from fresh sales data
 * - Database storage with confidence scoring
 * - Automatic fallback to hardcoded multipliers
 * - Update history tracking
 * 
 * Usage:
 * - Call updateMarketMultipliers() periodically (daily/weekly)
 * - Use getMarketMultiplierFromDB() in market calculations
 * - Check getLatestUpdateInfo() for system health
 * 
 * Tables:
 * - market_multipliers: Current multiplier values
 * - market_multiplier_updates: Update run history
 */

import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MarketMultiplierData {
  position: string;
  age_range: string;
  overall_range: string;
  multiplier: number;
  sample_size: number;
  avg_price: number;
  confidence_score: number;
}

interface UpdateRunMetrics {
  total_combinations_analyzed: number;
  combinations_updated: number;
  combinations_added: number;
  sales_data_window_days: number;
  total_sales_analyzed: number;
}

/**
 * Update market multipliers based on fresh sales data
 * This should be run periodically to keep multipliers current
 */
export async function updateMarketMultipliers(
  options: {
    windowDays?: number;
    minSampleSize?: number;
    forceUpdate?: boolean;
  } = {}
): Promise<{
  success: boolean;
  runId: string;
  metrics: UpdateRunMetrics;
  error?: string;
}> {
  const { windowDays = 540, minSampleSize = 5, forceUpdate = false } = options; // 18 months lookback
  const startTime = new Date();
  const runId = crypto.randomUUID();
  
  console.log(`[Market Multiplier Update] Starting update run ${runId} with ${windowDays} day window`);

  try {
    // Create update run record
    const { error: runError } = await supabase
      .from('market_multiplier_updates')
      .insert({
        update_run_id: runId,
        total_combinations_analyzed: 0,
        combinations_updated: 0,
        combinations_added: 0,
        sales_data_window_days: windowDays,
        total_sales_analyzed: 0,
        started_at: startTime.toISOString(),
        status: 'running'
      });

    if (runError) {
      console.error('Failed to create update run record:', runError);
      throw runError;
    }

    // Get ALL sales data within the window using pagination
    const cutoffDate = Date.now() - (windowDays * 24 * 60 * 60 * 1000);
    console.log(`[Market Multiplier Update] Fetching sales data since ${new Date(cutoffDate).toISOString()}`);
    
    let allSalesData: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      console.log(`[Market Multiplier Update] Fetching sales batch ${Math.floor(from / batchSize) + 1} (from ${from})`);
      
      const { data: salesBatch, error: salesError } = await supabase
        .from('sales')
        .select('price, player_age, player_overall, player_position, purchase_date_time')
        .eq('status', 'BOUGHT')
        .gte('price', 1)
        .gte('purchase_date_time', cutoffDate)
        .not('player_age', 'is', null)
        .not('player_overall', 'is', null)
        .not('player_position', 'is', null)
        .range(from, from + batchSize - 1)
        .order('purchase_date_time', { ascending: true });

      if (salesError) {
        console.error('Failed to fetch sales data:', salesError);
        throw salesError;
      }

      if (!salesBatch || salesBatch.length === 0) {
        hasMore = false;
        break;
      }

      allSalesData.push(...salesBatch);
      from += batchSize;
      
      // If we got less than the batch size, we've reached the end
      if (salesBatch.length < batchSize) {
        hasMore = false;
      }
      
      console.log(`[Market Multiplier Update] Fetched ${salesBatch.length} sales in this batch, total so far: ${allSalesData.length}`);
    }

    const totalSales = allSalesData.length;
    console.log(`[Market Multiplier Update] Analyzing ${totalSales} sales from last ${windowDays} days`);

    if (totalSales === 0) {
      throw new Error('No sales data available for analysis');
    }

    // Group sales by position, age range, and overall range
    const groupedSales = groupSalesByFactors(allSalesData);
    const totalCombinations = Object.keys(groupedSales).length;
    
    console.log(`[Market Multiplier Update] Found ${totalCombinations} unique combinations`);

    // Calculate multipliers for combinations with data + generate comprehensive coverage
    const directMultipliers: MarketMultiplierData[] = [];
    const baselinePrice = calculateBaselinePrice(allSalesData);
    
    console.log(`[Market Multiplier Update] Baseline price: $${baselinePrice.toFixed(2)}`);

    // Process combinations that have direct sales data
    for (const [key, sales] of Object.entries(groupedSales)) {
      if (sales.length < minSampleSize) continue;

      const [position, ageRange, overallRange] = key.split('|');
      const avgPrice = sales.reduce((sum, sale) => sum + sale.price, 0) / sales.length;
      const multiplier = avgPrice / baselinePrice;
      
      // Calculate confidence based on sample size and price consistency
      const priceVariability = calculatePriceVariability(sales.map(s => s.price));
      const sampleSizeScore = Math.min(1.0, sales.length / 20); // Max score at 20+ samples
      const consistencyScore = Math.max(0.1, 1.0 - priceVariability); // Lower variability = higher score
      const confidenceScore = (sampleSizeScore + consistencyScore) / 2;

      directMultipliers.push({
        position,
        age_range: ageRange,
        overall_range: overallRange,
        multiplier: Number(multiplier.toFixed(4)),
        sample_size: sales.length,
        avg_price: Number(avgPrice.toFixed(2)),
        confidence_score: Number(confidenceScore.toFixed(2))
      });
    }

    console.log(`[Market Multiplier Update] Generated ${directMultipliers.length} multipliers from direct sales data`);

    // Generate comprehensive multipliers for ALL combinations (including interpolated ones)
    const newMultipliers = generateComprehensiveMultipliersFromData(directMultipliers, baselinePrice);
    
    console.log(`[Market Multiplier Update] Generated ${newMultipliers.length} total multipliers (direct + interpolated)`);

    let addedCount = 0;
    let updatedCount = 0;

    // Upsert multipliers to database
    for (const multiplier of newMultipliers) {
      const { data: existing } = await supabase
        .from('market_multipliers')
        .select('id, multiplier, last_updated')
        .eq('position', multiplier.position)
        .eq('age_range', multiplier.age_range)
        .eq('overall_range', multiplier.overall_range)
        .single();

      if (existing) {
        // Update existing if changed significantly or forced
        const multiplierChange = Math.abs(existing.multiplier - multiplier.multiplier);
        const shouldUpdate = forceUpdate || multiplierChange > 0.05; // 5% change threshold
        
        if (shouldUpdate) {
          await supabase
            .from('market_multipliers')
            .update({
              multiplier: multiplier.multiplier,
              sample_size: multiplier.sample_size,
              avg_price: multiplier.avg_price,
              confidence_score: multiplier.confidence_score,
              last_updated: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          updatedCount++;
        }
      } else {
        // Insert new multiplier
        await supabase
          .from('market_multipliers')
          .insert(multiplier);
        
        addedCount++;
      }
    }

    // Update run metrics
    const metrics: UpdateRunMetrics = {
      total_combinations_analyzed: totalCombinations,
      combinations_updated: updatedCount,
      combinations_added: addedCount,
      sales_data_window_days: windowDays,
      total_sales_analyzed: totalSales
    };

    await supabase
      .from('market_multiplier_updates')
      .update({
        ...metrics,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('update_run_id', runId);

    console.log(`[Market Multiplier Update] Completed run ${runId}:`, metrics);

    return {
      success: true,
      runId,
      metrics
    };

  } catch (error) {
    console.error(`[Market Multiplier Update] Failed run ${runId}:`, error);

    // Mark run as failed
    await supabase
      .from('market_multiplier_updates')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('update_run_id', runId);

    return {
      success: false,
      runId,
      metrics: {
        total_combinations_analyzed: 0,
        combinations_updated: 0,
        combinations_added: 0,
        sales_data_window_days: windowDays,
        total_sales_analyzed: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get market multiplier from database (replaces hardcoded lookup)
 */
export async function getMarketMultiplierFromDB(
  position: string,
  age: number,
  overall: number
): Promise<number> {
  const ageRange = getAgeRange(age);
  const overallRange = getOverallRange(overall);

  try {
    const { data, error } = await supabase
      .from('market_multipliers')
      .select('multiplier, confidence_score')
      .eq('position', position)
      .eq('age_range', ageRange)
      .eq('overall_range', overallRange)
      .single();

    if (error || !data) {
      // Fallback to similar positions or default
      return getFallbackMultiplier(position, age, overall);
    }

    return data.multiplier;
  } catch (error) {
    console.error('Error fetching multiplier from DB:', error);
    return getFallbackMultiplier(position, age, overall);
  }
}

/**
 * Get the latest update run information
 */
export async function getLatestUpdateInfo(): Promise<{
  lastUpdate: string | null;
  totalMultipliers: number;
  averageConfidence: number;
  updateHistory: Array<{
    runId: string;
    completedAt: string;
    status: string;
    metrics: UpdateRunMetrics;
  }>;
}> {
  try {
    // Get multiplier summary
    const { data: multipliers } = await supabase
      .from('market_multipliers')
      .select('confidence_score, last_updated');

    const totalMultipliers = multipliers?.length || 0;
    const averageConfidence = totalMultipliers > 0 
      ? multipliers!.reduce((sum, m) => sum + m.confidence_score, 0) / totalMultipliers
      : 0;
    
    const lastUpdate = totalMultipliers > 0
      ? multipliers!.reduce((latest, m) => 
          m.last_updated > latest ? m.last_updated : latest, 
          multipliers![0].last_updated
        )
      : null;

    // Get recent update history
    const { data: updates } = await supabase
      .from('market_multiplier_updates')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(10);

    const updateHistory = (updates || []).map(update => ({
      runId: update.update_run_id,
      completedAt: update.completed_at || update.started_at,
      status: update.status,
      metrics: {
        total_combinations_analyzed: update.total_combinations_analyzed,
        combinations_updated: update.combinations_updated,
        combinations_added: update.combinations_added,
        sales_data_window_days: update.sales_data_window_days,
        total_sales_analyzed: update.total_sales_analyzed
      }
    }));

    return {
      lastUpdate,
      totalMultipliers,
      averageConfidence: Number(averageConfidence.toFixed(2)),
      updateHistory
    };

  } catch (error) {
    console.error('Error getting update info:', error);
    return {
      lastUpdate: null,
      totalMultipliers: 0,
      averageConfidence: 0,
      updateHistory: []
    };
  }
}

// Helper functions

function groupSalesByFactors(sales: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  for (const sale of sales) {
    const ageRange = getAgeRange(sale.player_age);
    const overallRange = getOverallRange(sale.player_overall);
    const key = `${sale.player_position}|${ageRange}|${overallRange}`;
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(sale);
  }
  
  return groups;
}

function calculateBaselinePrice(sales: any[]): number {
  // Use CM, age 25, 76-78 overall as baseline (new system)
  const baselineSales = sales.filter(sale => 
    sale.player_position === 'CM' &&
    sale.player_age === 25 &&
    sale.player_overall >= 76 && sale.player_overall <= 78
  );
  
  if (baselineSales.length >= 3) {
    return baselineSales.reduce((sum, sale) => sum + sale.price, 0) / baselineSales.length;
  }
  
  // Broader baseline: CM, ages 24-27, 76-78 overall
  const broaderBaselineSales = sales.filter(sale => 
    sale.player_position === 'CM' &&
    sale.player_age >= 24 && sale.player_age <= 27 &&
    sale.player_overall >= 76 && sale.player_overall <= 78
  );
  
  if (broaderBaselineSales.length >= 5) {
    return broaderBaselineSales.reduce((sum, sale) => sum + sale.price, 0) / broaderBaselineSales.length;
  }
  
  // Fallback: use overall median price
  const allPrices = sales.map(s => s.price).sort((a, b) => a - b);
  return allPrices[Math.floor(allPrices.length / 2)];
}

function calculatePriceVariability(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  
  // Return coefficient of variation (normalized variability)
  return mean > 0 ? stdDev / mean : 0;
}

function getAgeRange(age: number): string {
  // Individual ages (16-40)
  const clampedAge = Math.max(16, Math.min(40, age));
  return clampedAge.toString();
}

function getOverallRange(overall: number): string {
  // Smaller 3-point overall brackets
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
  return '40-42'; // Minimum bracket for any valid player
}

function getFallbackMultiplier(position: string, age: number, overall: number): number {
  // Basic fallback based on overall rating (adjusted baseline to 76-78)
  const baseMultiplier = Math.pow(overall / 77, 2);
  
  // Individual age adjustment (more granular)
  let ageMultiplier: number;
  if (age <= 20) ageMultiplier = 1.50;
  else if (age <= 22) ageMultiplier = 1.30;
  else if (age <= 24) ageMultiplier = 1.10;
  else if (age <= 27) ageMultiplier = 1.00; // BASELINE
  else if (age <= 29) ageMultiplier = 0.85;
  else if (age <= 32) ageMultiplier = 0.65;
  else if (age <= 35) ageMultiplier = 0.45;
  else ageMultiplier = 0.30;
  
  // Position adjustment (15 valid positions, removed AMC)
  const positionMultipliers: Record<string, number> = {
    'ST': 1.25,   'CF': 1.20,   'CAM': 1.15,
    'CM': 1.00,   'LW': 1.10,   'RW': 1.10,   'LM': 0.95,
    'RM': 0.95,   'CDM': 0.90,  'RB': 0.85,   'LB': 0.85,
    'RWB': 0.80,  'LWB': 0.80,  'CB': 0.75,   'GK': 0.70
  };
  
  const positionMultiplier = positionMultipliers[position] || 1.0;
  
  return Math.max(0.001, baseMultiplier * ageMultiplier * positionMultiplier);
}

/**
 * Generate comprehensive multipliers for ALL combinations
 * Uses direct sales data where available, interpolates for missing combinations
 */
function generateComprehensiveMultipliersFromData(
  directMultipliers: MarketMultiplierData[],
  baselinePrice: number
): MarketMultiplierData[] {
  // All possible combinations
  const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];
  const ALL_AGES = Array.from({length: 25}, (_, i) => (16 + i).toString());
  const ALL_OVERALL_RANGES = [
    '97-99', '94-96', '91-93', '88-90', '85-87', '82-84', '79-81', '76-78', 
    '73-75', '70-72', '67-69', '64-66', '61-63', '58-60', '55-57', '52-54', 
    '49-51', '46-48', '43-45', '40-42'
  ];

  // Create lookup map for direct multipliers
  const directLookup = new Map<string, MarketMultiplierData>();
  for (const mult of directMultipliers) {
    const key = `${mult.position}|${mult.age_range}|${mult.overall_range}`;
    directLookup.set(key, mult);
  }

  const allMultipliers: MarketMultiplierData[] = [];

  // Generate multiplier for every possible combination
  for (const position of ALL_POSITIONS) {
    for (const ageStr of ALL_AGES) {
      for (const overallRange of ALL_OVERALL_RANGES) {
        const key = `${position}|${ageStr}|${overallRange}`;
        
        // Use direct data if available
        if (directLookup.has(key)) {
          allMultipliers.push(directLookup.get(key)!);
          continue;
        }

        // Otherwise, interpolate/estimate
        const age = parseInt(ageStr);
        const overallMid = getOverallRangeMidpoint(overallRange);
        
        // Try to find similar combinations for interpolation
        const interpolatedMultiplier = interpolateMultiplier(
          position, age, overallRange, directLookup, baselinePrice
        );

        allMultipliers.push({
          position,
          age_range: ageStr,
          overall_range: overallRange,
          multiplier: Number(interpolatedMultiplier.toFixed(4)),
          sample_size: 0, // Mark as interpolated
          avg_price: Number((interpolatedMultiplier * baselinePrice).toFixed(2)),
          confidence_score: 0.20 // Low confidence for interpolated values
        });
      }
    }
  }

  return allMultipliers;
}

/**
 * Interpolate multiplier for combinations without direct sales data
 */
function interpolateMultiplier(
  position: string,
  age: number,
  overallRange: string,
  directLookup: Map<string, MarketMultiplierData>,
  baselinePrice: number
): number {
  // Try to find multipliers for same position, similar ages/overalls
  const similarMultipliers: Array<{multiplier: number, distance: number}> = [];

  for (const [key, data] of directLookup.entries()) {
    const [dataPos, dataAgeStr, dataOverallRange] = key.split('|');
    
    if (dataPos !== position) continue; // Same position only
    
    const dataAge = parseInt(dataAgeStr);
    const ageDistance = Math.abs(age - dataAge);
    const overallDistance = getOverallRangeDistance(overallRange, dataOverallRange);
    
    // Weight by distance (closer = more influence)
    const totalDistance = ageDistance + overallDistance * 2; // Overall matters more
    if (totalDistance <= 10) { // Only use reasonably close matches
      similarMultipliers.push({
        multiplier: data.multiplier,
        distance: totalDistance
      });
    }
  }

  if (similarMultipliers.length > 0) {
    // Weighted average based on distance (closer matches have more weight)
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const sim of similarMultipliers) {
      const weight = 1 / (sim.distance + 1); // +1 to avoid division by zero
      weightedSum += sim.multiplier * weight;
      totalWeight += weight;
    }
    
    return weightedSum / totalWeight;
  }

  // Fallback: use theoretical multiplier
  const overallMid = getOverallRangeMidpoint(overallRange);
  return getFallbackMultiplier(position, age, overallMid);
}

/**
 * Get midpoint of overall range (e.g., "76-78" -> 77)
 */
function getOverallRangeMidpoint(range: string): number {
  const [min, max] = range.split('-').map(Number);
  return Math.round((min + max) / 2);
}

/**
 * Calculate distance between two overall ranges
 */
function getOverallRangeDistance(range1: string, range2: string): number {
  const mid1 = getOverallRangeMidpoint(range1);
  const mid2 = getOverallRangeMidpoint(range2);
  return Math.abs(mid1 - mid2);
}