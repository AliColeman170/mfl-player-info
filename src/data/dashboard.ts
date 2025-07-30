import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { fetchAllPlayerSales } from '@/lib/pagination';
import { Listing } from '@/types/global.types';

export interface MarketOverviewData {
  totalPlayers: number;
  avgMarketValue: number;
  activeListings: number;
  contractedPlayers: number;
  totalMarketCap: number;
}

export async function getMarketOverview(): Promise<MarketOverviewData> {
  const supabase = await createClient();
  
  // Get total player count
  const { count: totalPlayers, error: countError } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    console.error('Error fetching player count:', countError);
    throw new Error('Failed to fetch player count');
  }

  // Get active listings count
  const { count: activeListings, error: listingsError } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('current_listing_id', 'is', null);

  if (listingsError) {
    console.error('Error fetching active listings count:', listingsError);
    throw new Error('Failed to fetch active listings count');
  }

  // Get contracted players count
  const { count: contractedPlayers, error: contractError } = await supabase
    .from('players')
    .select('id', { count: 'exact', head: true })
    .not('contract_id', 'is', null);

  if (contractError) {
    console.error('Error fetching contracted players count:', contractError);
    throw new Error('Failed to fetch contracted players count');
  }

  // Get market data for calculations (still need the actual data for calculations)
  const { data, error } = await supabase
    .from('players')
    .select('market_value_estimate')
    .not('market_value_estimate', 'is', null);

  if (error) {
    console.error('Error fetching market overview:', error);
    throw new Error('Failed to fetch market overview data');
  }
  const marketValues = data.map(p => p.market_value_estimate).filter(Boolean);
  const avgMarketValue = marketValues.length > 0 
    ? marketValues.reduce((sum, val) => sum + val, 0) / marketValues.length 
    : 0;
  const totalMarketCap = marketValues.reduce((sum, val) => sum + val, 0);

  return {
    totalPlayers: totalPlayers || 0,
    avgMarketValue: Math.round(avgMarketValue),
    activeListings: activeListings || 0,
    contractedPlayers: contractedPlayers || 0,
    totalMarketCap: Math.round(totalMarketCap),
  };
}

export async function getRecentSales(limit: number = 10): Promise<Listing[]> {
  try {
    // Get recent sales from the last 30 days across all players
    const sales = await fetchAllPlayerSales(
      16, // min age
      40, // max age  
      0,  // min overall
      99, // max overall
      'ALL', // all positions
      { maxPages: 1 } // limit to first page for performance
    );

    // Filter to only sales that have purchase dates and sort by most recent
    const recentSales = sales
      .filter(sale => sale.purchaseDateTime)
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

export async function getTopPlayersByValue(limit: number = 10): Promise<TopPlayer[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name')
    .not('market_value_estimate', 'is', null)
    .order('market_value_estimate', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top players by value:', error);
    return [];
  }

  return data || [];
}

export async function getBestValuePlayers(limit: number = 10): Promise<TopPlayer[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name')
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
    .map(player => ({
      ...player,
      valueRatio: (player.overall || 0) / (player.market_value_estimate || 1)
    }))
    .sort((a, b) => b.valueRatio - a.valueRatio)
    .slice(0, limit);

  return playersWithValueRatio;
}

export async function getRisingStars(limit: number = 10): Promise<TopPlayer[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name')
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

export async function getTopRatedPlayers(limit: number = 5): Promise<TopPlayer[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, overall, primary_position, market_value_estimate, age, club_name')
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
  
  const { data, error } = await supabase.rpc('get_top_owners', {
    limit_count: limit
  });

  if (error) {
    console.error('Error fetching top owners:', error);
    return [];
  }

  return data || [];
}

export interface FavoritePlayer extends TopPlayer {
  favorite_count: number;
}

export async function getFavoritePlayers(limit: number = 5): Promise<FavoritePlayer[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_favorite_players', {
    limit_count: limit
  });

  if (error) {
    console.error('Error fetching favorite players:', error);
    return [];
  }

  return data || [];
}