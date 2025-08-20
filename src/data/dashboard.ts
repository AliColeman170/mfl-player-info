import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { fetchAllPlayerSales } from '@/lib/pagination';
import { Listing } from '@/types/global.types';

export interface MarketOverviewData {
  success: boolean;
  totalPlayers: number;
  totalSalesVolume: number;
  totalSalesCount: number;
  contractedPlayers: number;
  totalMarketCap: number;
}

export async function getMarketOverview(): Promise<
  MarketOverviewData | { success: false }
> {
  const supabase = await createClient();

  // Initialize fallback values
  let totalPlayers = 0;
  let totalSalesCount = 0;
  let contractedPlayers = 0;
  let totalSalesVolume = 0;
  let totalMarketCap = 0;

  try {
    // Get total player count
    const { count: totalPlayersCount, error: countError } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Error fetching player count:', countError);
    } else {
      totalPlayers = totalPlayersCount || 0;
    }

    // Get total sales count with timeout handling
    try {
      const { count: salesCount, error: salesError } = await supabase
        .from('sales')
        .select('listing_resource_id', { count: 'exact', head: true });

      if (salesError) {
        console.error('Error fetching total sales count:', salesError);
      } else {
        totalSalesCount = salesCount || 0;
      }
    } catch (listingsTimeout) {
      console.warn(
        'Active listings query timed out, using fallback value:',
        listingsTimeout
      );
      totalSalesCount = 0;
    }

    // Get contracted players count
    try {
      const { count: contractedPlayersCount, error: contractError } =
        await supabase
          .from('players')
          .select('id', { count: 'exact', head: true })
          .not('contract_id', 'is', null);

      if (contractError) {
        console.error(
          'Error fetching contracted players count:',
          contractError
        );
      } else {
        contractedPlayers = contractedPlayersCount || 0;
      }
    } catch (contractTimeout) {
      console.warn(
        'Contracted players query timed out, using fallback value:',
        contractTimeout
      );
      contractedPlayers = 0;
    }

    // Get total sales volume using RPC function
    try {
      const { data: salesVolumeData, error: salesVolumeError } =
        await supabase.rpc('get_total_sales_volume');

      if (salesVolumeError) {
        console.error('Error fetching total sales volume:', salesVolumeError);
      } else {
        totalSalesVolume = salesVolumeData || 0;
      }
    } catch (salesVolumeTimeout) {
      console.warn(
        'Total sales volume query timed out, using fallback value:',
        salesVolumeTimeout
      );
      totalSalesVolume = 0;
    }

    // Get total market cap calculation with optimized query
    try {
      const { data, error } = await supabase
        .from('players')
        .select('market_value_estimate')
        .not('market_value_estimate', 'is', null)
        .limit(10000); // Limit to prevent timeout on large datasets

      if (error) {
        console.error('Error fetching market cap data:', error);
      } else if (data && data.length > 0) {
        const marketValues = data
          .map((p) => p.market_value_estimate)
          .filter(Boolean) as number[];
        totalMarketCap = marketValues.reduce((sum, val) => sum + (val || 0), 0);
      }
    } catch (marketTimeout) {
      console.warn(
        'Market cap query timed out, using fallback values:',
        marketTimeout
      );
      totalMarketCap = 0;
    }
  } catch (error) {
    console.error('Error in getMarketOverview:', error);
    // Return fallback data instead of throwing
    return {
      success: false,
    };
  }

  return {
    success: true,
    totalPlayers,
    totalSalesVolume,
    totalSalesCount,
    contractedPlayers,
    totalMarketCap: Math.round(totalMarketCap),
  };
}

export async function getRecentSales(limit: number = 10): Promise<Listing[]> {
  try {
    // Get recent sales from the last 30 days across all players
    const sales = await fetchAllPlayerSales(
      16, // min age
      40, // max age
      0, // min overall
      99, // max overall
      'ALL', // all positions
      { maxPages: 1 } // limit to first page for performance
    );

    // Filter to only sales that have purchase dates and sort by most recent
    const recentSales = sales
      .filter((sale) => sale.purchaseDateTime)
      .sort((a, b) => (b.purchaseDateTime || 0) - (a.purchaseDateTime || 0))
      .slice(0, limit);

    return recentSales;
  } catch (error) {
    console.error('Error fetching recent sales:', error);
    return [];
  }
}

export interface TopPlayer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  overall: number | null;
  primary_position: string | null;
  market_value_estimate: number | null;
  age: number | null;
  club_name: string | null;
}

export async function getTopPlayersByValue(
  limit: number = 10
): Promise<TopPlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('players')
    .select(
      'id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name'
    )
    .not('market_value_estimate', 'is', null)
    .order('market_value_estimate', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top players by value:', error);
    return [];
  }

  return data || [];
}

export async function getBestValuePlayers(
  limit: number = 10
): Promise<TopPlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('players')
    .select(
      'id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name'
    )
    .not('market_value_estimate', 'is', null)
    .not('overall', 'is', null)
    .gte('market_value_estimate', 1) // avoid division by zero
    .order('overall', { ascending: false }) // Start with high overall players
    .limit(100); // Get more to calculate value ratios

  if (error) {
    console.error('Error fetching best value players:', error);
    return [];
  }

  // Calculate value per overall rating point and sort
  const playersWithValueRatio = (data || [])
    .map((player) => ({
      ...player,
      valueRatio: (player.overall || 0) / (player.market_value_estimate || 1),
    }))
    .sort((a, b) => b.valueRatio - a.valueRatio)
    .slice(0, limit);

  return playersWithValueRatio;
}

export async function getRisingStars(limit: number = 10): Promise<TopPlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('players')
    .select(
      'id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name'
    )
    .not('market_value_estimate', 'is', null)
    .lt('age', 21)
    .order('market_value_estimate', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching rising stars:', error);
    return [];
  }

  return data || [];
}

export async function getTopRatedPlayers(
  limit: number = 5
): Promise<TopPlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('players')
    .select(
      'id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name'
    )
    .not('overall', 'is', null)
    .order('overall', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top rated players:', error);
    return [];
  }

  return data || [];
}

export interface TopOwner {
  owner_wallet_address: string;
  owner_name: string | null;
  player_count: number;
  total_value: number;
  avg_overall: number;
}

export async function getTopOwners(limit: number = 5): Promise<TopOwner[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('get_top_owners', {
      limit_count: limit,
    });

    if (error) {
      console.error('Error fetching top owners:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error(
      'Error fetching top owners, canceling statement due to statement timeout:',
      error
    );
    return [];
  }
}

export interface FavoritePlayer extends TopPlayer {
  favorite_count: number;
}

export async function getFavoritePlayers(
  limit: number = 5
): Promise<FavoritePlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_favorite_players', {
    limit_count: limit,
  });

  if (error) {
    console.error('Error fetching favorite players:', error);
    return [];
  }

  return data || [];
}
