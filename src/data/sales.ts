import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Player } from '@/types/global.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SaleRecord {
  id: number;
  listing_resource_id: number;
  player_id: number;
  price: number;
  seller_wallet_address: string | null;
  buyer_wallet_address: string | null;
  created_date_time: number;
  purchase_date_time: number | null;
  status: string;
  player_age: number | null;
  player_overall: number | null;
  player_position: string | null;
  imported_at: string;
  updated_at: string;
}

/**
 * Get minimum price threshold based on player overall rating
 * Reduced thresholds to capture more market data
 */
function getMinimumPriceThreshold(overall: number): number {
  if (overall >= 85) return 10; // Reduced from 25
  if (overall >= 75) return 5;  // Reduced from 10
  if (overall >= 65) return 3;  // Reduced from 5
  if (overall >= 55) return 1;
  return 0;
}

/**
 * Get enhanced market data from local sales database
 * Replaces the API-based getEnhancedMarketData function
 */
export async function getEnhancedMarketDataFromDB(
  player: Player,
  options: {
    maxResults?: number;
    expandSearch?: boolean;
  } = {}
): Promise<{
  sales: SaleRecord[];
  sampleSize: number;
  searchCriteria: string;
  minPrice: number;
}> {
  const { maxResults = 50, expandSearch = true } = options;
  const minPrice = getMinimumPriceThreshold(player.metadata.overall);
  
  // Use longer lookback for high-rated players (85+ OVR) due to limited sales
  const lookbackDays = player.metadata.overall >= 85 ? 540 : 180; // 18 months vs 6 months
  const cutoffDate = Date.now() - (lookbackDays * 24 * 60 * 60 * 1000);

  try {
    let sales: SaleRecord[] = [];
    let searchAttempt = 0;
    const maxAttempts = expandSearch ? 8 : 1; // Increased from 3 to 8 for comprehensive search

    while (sales.length < 3 && searchAttempt < maxAttempts) {
      let ageRange, overallRange, useExactPosition;
      
      // Progressive search strategy
      if (searchAttempt < 3) {
        // Phase 1: Exact position, tight ranges
        ageRange = 1 + searchAttempt;
        overallRange = 1 + searchAttempt;
        useExactPosition = true;
      } else if (searchAttempt < 6) {
        // Phase 2: Exact position, wider ranges
        ageRange = 2 + (searchAttempt - 3) * 2; // 2, 4, 6
        overallRange = 3 + (searchAttempt - 3) * 2; // 3, 5, 7
        useExactPosition = true;
      } else {
        // Phase 3: Similar positions, very wide ranges
        ageRange = 8 + (searchAttempt - 6) * 3; // 8, 11
        overallRange = 8 + (searchAttempt - 6) * 3; // 8, 11
        useExactPosition = false;
      }

      console.log(
        `Search attempt ${searchAttempt + 1}: age ±${ageRange}, overall ±${overallRange}, position: ${useExactPosition ? 'exact' : 'similar'}, lookback: ${lookbackDays} days`
      );

      // Build query for sales matching player characteristics
      let query = supabase
        .from('sales')
        .select('*')
        .eq('status', 'BOUGHT')
        .gte('price', Math.max(1, minPrice - searchAttempt)) // Gradually reduce min price
        .gte('player_age', Math.max(16, player.metadata.age - ageRange)) // Min age 16
        .lte('player_age', Math.min(40, player.metadata.age + ageRange)) // Max age 40
        .gte('player_overall', Math.max(45, player.metadata.overall - overallRange)) // Min overall 45
        .lte('player_overall', Math.min(99, player.metadata.overall + overallRange)) // Max overall 99
        .gte('purchase_date_time', cutoffDate) // Use extended lookback for high-rated players
        .order('created_date_time', { ascending: false })
        .limit(maxResults);

      // Add position filter with increasing flexibility
      if (player.metadata.positions?.[0]) {
        if (useExactPosition) {
          query = query.eq('player_position', player.metadata.positions[0]);
        } else {
          // Similar positions for final attempts
          const playerPosition = player.metadata.positions[0];
          if (playerPosition === 'GK') {
            query = query.eq('player_position', 'GK');
          } else {
            // For outfield players, exclude only GK
            query = query.neq('player_position', 'GK');
          }
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      sales = data || [];
      console.log(
        `Found ${sales.length} sales for player ${player.id} (attempt ${searchAttempt + 1})`
      );

      searchAttempt++;
    }

    const finalPositionCriteria = searchAttempt <= 6 
      ? (player.metadata.positions?.[0] || 'any')
      : (player.metadata.positions?.[0] === 'GK' ? 'GK only' : 'outfield players');
    
    const searchCriteria = `age: ${player.metadata.age}±${Math.min(11, searchAttempt * 2)}, overall: ${player.metadata.overall}±${Math.min(11, searchAttempt * 2)}, position: ${finalPositionCriteria}`;

    return {
      sales,
      sampleSize: sales.length,
      searchCriteria,
      minPrice,
    };
  } catch (error) {
    console.error(`Error fetching market data for player ${player.id}:`, error);

    return {
      sales: [],
      sampleSize: 0,
      searchCriteria: 'error',
      minPrice,
    };
  }
}

/**
 * Get interpolated market estimate when no direct sales are available
 * This searches for similar players at different overall ratings to create a price range
 */
export async function getInterpolatedMarketEstimate(
  player: Player
): Promise<{
  estimatedValue: number;
  confidence: 'low';
  method: 'interpolated';
  basedOn: string;
  sampleSize: number;
}> {
  try {
    const position = player.metadata.positions?.[0] || 'ST';
    const age = player.metadata.age;
    const overall = player.metadata.overall;

    // Search for players at different overall ratings (±5, ±10)
    const searchRanges = [
      { overall: overall - 5, label: '-5' },
      { overall: overall - 10, label: '-10' },
      { overall: overall + 5, label: '+5' },
      { overall: overall + 10, label: '+10' },
    ];

    let foundSales: { overall: number; avgPrice: number; count: number }[] = [];

    for (const range of searchRanges) {
      if (range.overall < 45 || range.overall > 99) continue;

      const { data: sales } = await supabase
        .from('sales')
        .select('price')
        .eq('status', 'BOUGHT')
        .eq('player_position', position)
        .gte('player_age', Math.max(16, age - 5))
        .lte('player_age', Math.min(40, age + 5))
        .gte('player_overall', range.overall - 2)
        .lte('player_overall', range.overall + 2)
        .gte('price', 1)
        .order('created_date_time', { ascending: false })
        .limit(20);

      if (sales && sales.length >= 2) {
        const prices = sales.map(s => s.price);
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        foundSales.push({
          overall: range.overall,
          avgPrice,
          count: prices.length
        });
      }
    }

    if (foundSales.length >= 2) {
      // Interpolate between found values
      foundSales.sort((a, b) => a.overall - b.overall);
      
      // Find the closest values to interpolate between
      let lowerBound = foundSales.find(s => s.overall <= overall);
      let upperBound = foundSales.find(s => s.overall >= overall);
      
      if (!lowerBound) lowerBound = foundSales[0];
      if (!upperBound) upperBound = foundSales[foundSales.length - 1];

      let estimatedValue: number;
      if (lowerBound.overall === upperBound.overall) {
        estimatedValue = lowerBound.avgPrice;
      } else {
        // Linear interpolation
        const ratio = (overall - lowerBound.overall) / (upperBound.overall - lowerBound.overall);
        estimatedValue = lowerBound.avgPrice + ratio * (upperBound.avgPrice - lowerBound.avgPrice);
      }

      const totalSamples = foundSales.reduce((sum, s) => sum + s.count, 0);
      const dataPoints = foundSales.map(s => `${s.overall}ovr(${s.count})`).join(', ');

      return {
        estimatedValue: Math.round(Math.max(1, estimatedValue)),
        confidence: 'low',
        method: 'interpolated',
        basedOn: `Interpolated from ${position} players: ${dataPoints}`,
        sampleSize: totalSamples,
      };
    }

    // Final fallback: position-based estimate with wide age range
    const { data: positionSales } = await supabase
      .from('sales')
      .select('price')
      .eq('status', 'BOUGHT')
      .eq('player_position', position)
      .gte('price', 1)
      .order('created_date_time', { ascending: false })
      .limit(50);

    if (positionSales && positionSales.length > 0) {
      const prices = positionSales.map(s => s.price);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      
      // Adjust by overall rating
      const overallMultiplier = Math.pow(overall / 70, 2); // Scale based on overall
      const estimatedValue = Math.round(avgPrice * overallMultiplier);

      return {
        estimatedValue: Math.max(1, estimatedValue),
        confidence: 'low',
        method: 'interpolated',
        basedOn: `${position} average (${prices.length} sales) scaled by overall rating`,
        sampleSize: prices.length,
      };
    }

    // Ultimate fallback - should never happen with good sales data
    throw new Error('No market data available for interpolation');

  } catch (error) {
    console.error(`Error in interpolated estimate for player ${player.id}:`, error);
    
    // Emergency fallback based on overall rating only
    const baseValue = Math.max(1, Math.pow(player.metadata.overall / 60, 2.5) * 50);
    
    return {
      estimatedValue: Math.round(baseValue),
      confidence: 'low',
      method: 'interpolated',
      basedOn: 'Emergency fallback based on overall rating only',
      sampleSize: 0,
    };
  }
}

/**
 * Get sales data for a specific player by ID
 */
export async function getPlayerSalesFromDB(
  playerId: number
): Promise<SaleRecord[]> {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('player_id', playerId)
      .eq('status', 'BOUGHT')
      .order('created_date_time', { ascending: false })
      .limit(20);

    if (error) {
      console.error(`Error fetching sales for player ${playerId}:`, error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(`Error fetching player sales for ${playerId}:`, error);
    return [];
  }
}

/**
 * Get recent sales for market analysis
 */
export async function getRecentSalesFromDB(
  options: {
    limit?: number;
    daysBack?: number;
    minPrice?: number;
  } = {}
): Promise<SaleRecord[]> {
  const { limit = 100, daysBack = 30, minPrice = 1 } = options;

  // Calculate timestamp for X days ago
  const cutoffDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('status', 'BOUGHT')
      .gte('price', minPrice)
      .gte('created_date_time', cutoffDate)
      .order('created_date_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent sales:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
}

/**
 * Get sales statistics
 */
export async function getSalesStatsFromDB(): Promise<{
  totalSales: number;
  avgPrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  lastUpdated: string | null;
}> {
  try {
    // Get basic stats
    const { data: stats, error: statsError } = await supabase
      .from('sales')
      .select('price')
      .eq('status', 'BOUGHT');

    if (statsError) throw statsError;

    const prices = (stats || []).map((s) => s.price).sort((a, b) => a - b);

    const totalSales = prices.length;
    const avgPrice =
      totalSales > 0
        ? Math.round(prices.reduce((sum, p) => sum + p, 0) / totalSales)
        : 0;
    const medianPrice = totalSales > 0 ? prices[Math.floor(totalSales / 2)] : 0;
    const priceRange = {
      min: totalSales > 0 ? prices[0] : 0,
      max: totalSales > 0 ? prices[prices.length - 1] : 0,
    };

    // Get last updated timestamp
    const { data: lastSale, error: lastError } = await supabase
      .from('sales')
      .select('imported_at')
      .order('imported_at', { ascending: false })
      .limit(1)
      .single();

    if (lastError && lastError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.warn('Error getting last updated:', lastError);
    }

    return {
      totalSales,
      avgPrice,
      medianPrice,
      priceRange,
      lastUpdated: lastSale?.imported_at || null,
    };
  } catch (error) {
    console.error('Error getting sales stats:', error);
    return {
      totalSales: 0,
      avgPrice: 0,
      medianPrice: 0,
      priceRange: { min: 0, max: 0 },
      lastUpdated: null,
    };
  }
}
