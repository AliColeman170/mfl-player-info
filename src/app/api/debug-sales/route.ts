import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEnhancedMarketDataFromDB } from '@/data/sales';
import { Player } from '@/types/global.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('id') || '6164';
  
  try {
    console.log(`🔍 Debugging sales data for player #${playerId}...`);
    
    // Get player data
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select(`
        id, overall, age, primary_position, nationality, first_name, last_name
      `)
      .eq('id', parseInt(playerId))
      .single();
    
    if (playerError || !playerData) {
      throw new Error(`Player not found: ${playerError?.message}`);
    }
    
    // Create Player object
    const playerObj: Player = {
      id: playerData.id,
      hasPreContract: false,
      energy: 100,
      offerStatus: 0,
      metadata: {
        id: playerData.id,
        firstName: playerData.first_name || '',
        lastName: playerData.last_name || '',
        overall: playerData.overall || 0,
        age: playerData.age || 0,
        pace: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0, goalkeeping: 0,
        positions: playerData.primary_position ? [playerData.primary_position] : [],
        nationalities: playerData.nationality ? [playerData.nationality] : [],
        preferredFoot: '', height: 0, resistance: 0,
      }
    };
    
    console.log('🔍 Getting enhanced market data...');
    
    // Get the sales data that would be used for calculation
    const marketData = await getEnhancedMarketDataFromDB(playerObj, {
      maxResults: 50,
      expandSearch: true,
    });
    
    console.log(`Found ${marketData.sampleSize} sales`);
    
    // Analyze the sales data
    const salesWithTimestamps = marketData.sales.filter(sale => 
      sale.purchase_date_time !== null && sale.purchase_date_time !== undefined
    );
    
    const salesWithoutTimestamps = marketData.sales.filter(sale => 
      sale.purchase_date_time === null || sale.purchase_date_time === undefined
    );
    
    console.log(`Sales with timestamps: ${salesWithTimestamps.length}`);
    console.log(`Sales without timestamps: ${salesWithoutTimestamps.length}`);
    
    // Show sample sales data
    const sampleSales = marketData.sales.slice(0, 5).map(sale => ({
      price: sale.price,
      purchase_date_time: sale.purchase_date_time,
      created_date_time: sale.created_date_time,
      player_age: sale.player_age,
      player_overall: sale.player_overall,
      player_position: sale.player_position,
      hasValidTimestamp: sale.purchase_date_time !== null && sale.purchase_date_time !== undefined
    }));
    
    return NextResponse.json({
      success: true,
      player: {
        id: playerData.id,
        name: `${playerData.first_name} ${playerData.last_name}`,
        overall: playerData.overall,
        age: playerData.age,
        position: playerData.primary_position
      },
      salesData: {
        totalFound: marketData.sampleSize,
        withTimestamps: salesWithTimestamps.length,
        withoutTimestamps: salesWithoutTimestamps.length,
        searchCriteria: marketData.searchCriteria,
        minPrice: marketData.minPrice,
        sampleSales: sampleSales
      }
    });
    
  } catch (error) {
    console.error('💥 Sales debug failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: 'Sales debug failed',
      error: errorMessage
    }, { status: 500 });
  }
}