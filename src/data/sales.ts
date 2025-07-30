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
 */
function getMinimumPriceThreshold(overall: number): number {
  if (overall >= 85) return 25;
  if (overall >= 75) return 10;
  if (overall >= 65) return 5;
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

  try {
    let sales: SaleRecord[] = [];
    let searchAttempt = 0;
    const maxAttempts = expandSearch ? 3 : 1;

    while (sales.length < 5 && searchAttempt < maxAttempts) {
      const ageRange = 1 + searchAttempt;
      const overallRange = 1 + searchAttempt;

      console.log(`Search attempt ${searchAttempt + 1}: age ±${ageRange}, overall ±${overallRange}`);

      // Build query for sales matching player characteristics
      let query = supabase
        .from('sales')
        .select('*')
        .eq('status', 'BOUGHT')
        .gte('price', minPrice)
        .gte('player_age', player.metadata.age - ageRange)
        .lte('player_age', player.metadata.age + ageRange)
        .gte('player_overall', player.metadata.overall - overallRange)
        .lte('player_overall', player.metadata.overall + overallRange)
        .order('created_date_time', { ascending: false })
        .limit(maxResults);

      // Add position filter if available
      if (player.metadata.positions?.[0]) {
        query = query.eq('player_position', player.metadata.positions[0]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      sales = data || [];
      console.log(`Found ${sales.length} sales for player ${player.id} (attempt ${searchAttempt + 1})`);

      searchAttempt++;
    }

    const searchCriteria = `age: ${player.metadata.age}±${searchAttempt}, overall: ${player.metadata.overall}±${searchAttempt}, position: ${player.metadata.positions?.[0] || 'any'}`;

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
 * Get sales data for a specific player by ID
 */
export async function getPlayerSalesFromDB(playerId: number): Promise<SaleRecord[]> {
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
  const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

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

    const prices = (stats || []).map(s => s.price).sort((a, b) => a - b);
    
    const totalSales = prices.length;
    const avgPrice = totalSales > 0 ? Math.round(prices.reduce((sum, p) => sum + p, 0) / totalSales) : 0;
    const medianPrice = totalSales > 0 ? prices[Math.floor(totalSales / 2)] : 0;
    const priceRange = {
      min: totalSales > 0 ? prices[0] : 0,
      max: totalSales > 0 ? prices[prices.length - 1] : 0
    };

    // Get last updated timestamp
    const { data: lastSale, error: lastError } = await supabase
      .from('sales')
      .select('imported_at')
      .order('imported_at', { ascending: false })
      .limit(1)
      .single();

    if (lastError && lastError.code !== 'PGRST116') { // PGRST116 = no rows returned
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