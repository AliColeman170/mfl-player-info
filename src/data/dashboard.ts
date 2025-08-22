import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { fetchAllPlayerSales } from '@/lib/pagination';
import { Listing } from '@/types/global.types';
import { cache } from 'react';

export interface TotalPlayersData {
  success: boolean;
  totalPlayers: number;
}

export interface ContractedPlayersData {
  success: boolean;
  contractedPlayers: number;
}
export interface TotalSalesCountData {
  success: boolean;
  totalSales: number;
}
export interface TotalSalesVolumeData {
  success: boolean;
  totalSalesVolume: number;
}

export const getTotalPlayers = cache(
  async (): Promise<TotalPlayersData | { success: false }> => {
    const supabase = await createClient();

    // Initialize fallback values
    let totalPlayers = 0;

    try {
      // Get total player count
      const { data, error: countError } = await supabase
        .from('sync_config')
        .select('config_value')
        .eq('config_key', 'total_player_count')
        .single();

      if (countError) {
        console.error('Error fetching player count:', countError);
      } else {
        totalPlayers = data.config_value ? parseInt(data.config_value) : 0;
      }
    } catch (error) {
      console.error('Error in getTotalPlayers:', error);
      // Return fallback data instead of throwing
      return {
        success: false,
      };
    }

    return {
      success: true,
      totalPlayers,
    };
  }
);

export const getContractedPlayers = cache(
  async (): Promise<ContractedPlayersData | { success: false }> => {
    const supabase = await createClient();

    // Initialize fallback values
    let contractedPlayers = 0;

    try {
      // Get total player count
      const { count: contractedPlayersCount, error: countError } =
        await supabase
          .from('contracted_players')
          .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('Error fetching player count:', countError);
      } else {
        contractedPlayers = contractedPlayersCount || 0;
      }
    } catch (error) {
      console.error('Error in getContractedPlayers:', error);
      // Return fallback data instead of throwing
      return {
        success: false,
      };
    }

    return {
      success: true,
      contractedPlayers,
    };
  }
);

export const getTotalSalesCount = cache(
  async (): Promise<TotalSalesCountData | { success: false }> => {
    const supabase = await createClient();

    // Initialize fallback values
    let totalSales = 0;

    try {
      // Get total sales count
      const { data, error: countError } = await supabase
        .from('sync_config')
        .select('config_value')
        .eq('config_key', 'total_sales_count')
        .single();

      if (countError) {
        console.error('Error fetching sales count:', countError);
      } else {
        totalSales = data.config_value ? parseInt(data.config_value) : 0;
      }
    } catch (error) {
      console.error('Error in getTotalSalesCount:', error);
      // Return fallback data instead of throwing
      return {
        success: false,
      };
    }

    return {
      success: true,
      totalSales,
    };
  }
);

export const getTotalSalesVolume = cache(
  async (): Promise<TotalSalesVolumeData | { success: false }> => {
    const supabase = await createClient();

    // Initialize fallback values
    let totalSalesVolume = 0;

    try {
      // Get total sales volume
      const { data, error: countError } = await supabase
        .from('sync_config')
        .select('config_value')
        .eq('config_key', 'total_sales_volume')
        .single();

      if (countError) {
        console.error('Error fetching player count:', countError);
      } else {
        totalSalesVolume = data?.config_value ? parseInt(data.config_value) : 0;
      }
    } catch (error) {
      console.error('Error in getTotalSalesVolume:', error);
      // Return fallback data instead of throwing
      return {
        success: false,
      };
    }

    return {
      success: true,
      totalSalesVolume,
    };
  }
);

export const getRecentSales = cache(
  async (limit: number = 10): Promise<Listing[]> => {
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
);

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

export const getTopRatedPlayers = cache(
  async (limit: number = 5): Promise<TopPlayer[]> => {
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
);

export interface TopOwner {
  owner_wallet_address: string;
  owner_name: string | null;
  player_count: number;
}

export const getTopOwners = cache(
  async (limit: number = 5): Promise<TopOwner[]> => {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase
        .from('top_owners')
        .select('*')
        .order('player_count', { ascending: false })
        .limit(limit)
        .overrideTypes<Array<TopOwner>, { merge: false }>();

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
);

export interface FavoritePlayer extends TopPlayer {
  favorite_count: number;
}

export async function getFavoritePlayers(
  limit: number = 5
): Promise<FavoritePlayer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('favourite_players')
    .select('*')
    .order('favorite_count', { ascending: false })
    .limit(limit)
    .overrideTypes<Array<FavoritePlayer>, { merge: false }>();

  if (error) {
    console.error('Error fetching favorite players:', error);
    return [];
  }

  return data || [];
}
