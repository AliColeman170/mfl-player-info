import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateMarketValue } from '@/services/market-value';
import { Player } from '@/types/global.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('id') || '6164'; // Default to Tobias Schinnerl
  
  try {
    console.log(`🔍 Debugging market value calculation for player #${playerId}...`);
    
    // Get player data
    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select(`
        id, overall, age, pace, shooting, passing, dribbling, defense, physical, 
        goalkeeping, primary_position, nationality, first_name, last_name
      `)
      .eq('id', parseInt(playerId))
      .single();
    
    if (playerError || !playerData) {
      throw new Error(`Player not found: ${playerError?.message}`);
    }
    
    console.log(`Player: ${playerData.first_name} ${playerData.last_name} (${playerData.overall} OVR, ${playerData.age} age, ${playerData.primary_position})`);
    
    // Create Player object for calculation
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
        pace: playerData.pace || 0,
        shooting: playerData.shooting || 0,
        passing: playerData.passing || 0,
        dribbling: playerData.dribbling || 0,
        defense: playerData.defense || 0,
        physical: playerData.physical || 0,
        goalkeeping: playerData.goalkeeping || 0,
        positions: playerData.primary_position ? [playerData.primary_position] : [],
        nationalities: playerData.nationality ? [playerData.nationality] : [],
        preferredFoot: '',
        height: 0,
        resistance: 0,
      }
    };
    
    console.log('🧮 Running market value calculation...');
    
    // Run the market value calculation with detailed logging
    const result = await calculateMarketValue(playerObj);
    
    console.log('📊 Calculation Result:', {
      estimatedValue: result.estimatedValue,
      confidence: result.confidence,
      method: result.method,
      sampleSize: result.sampleSize,
      dataQuality: result.dataQuality,
      basedOn: result.basedOn
    });
    
    return NextResponse.json({
      success: true,
      player: {
        id: playerData.id,
        name: `${playerData.first_name} ${playerData.last_name}`,
        overall: playerData.overall,
        age: playerData.age,
        position: playerData.primary_position
      },
      calculation: {
        estimatedValue: result.estimatedValue,
        priceRange: result.priceRange,
        confidence: result.confidence,
        method: result.method,
        sampleSize: result.sampleSize,
        dataQuality: result.dataQuality,
        explanation: result.explanation,
        basedOn: result.basedOn
      },
      debug: {
        calculationTime: result.breakdown.calculationTime
      }
    });
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({
      success: false,
      message: 'Debug failed',
      error: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}