import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateMarketValue } from '@/services/market-value';
import { Player } from '@/types/global.types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { limit = 50, batchSize = 10 } = await request.json().catch(() => ({}));
    
    console.log(`🔧 Starting fix for zero market values (limit: ${limit}, batchSize: ${batchSize})...`);
    
    // Get players with zero market values
    const { data: players, error: fetchError } = await supabase
      .from('players')
      .select(`
        id, overall, age, pace, shooting, passing, dribbling, defense, physical, 
        goalkeeping, primary_position, nationality, first_name, last_name
      `)
      .eq('market_value_estimate', 0)
      .not('market_value_updated_at', 'is', null)
      .order('overall', { ascending: false })
      .limit(limit);
    
    if (fetchError) {
      throw new Error(`Failed to fetch players: ${fetchError.message}`);
    }
    
    if (!players || players.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No players with zero market values found',
        processed: 0,
        failed: 0
      });
    }
    
    console.log(`Found ${players.length} players with zero market values`);
    
    let totalProcessed = 0;
    let totalFailed = 0;
    const errors: string[] = [];
    
    // Process in batches
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(players.length / batchSize)}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (player) => {
          // Create Player object for calculation
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
          
          // Calculate market value
          const marketValueResult = await calculateMarketValue(playerObj);
          
          // Determine if calculation should be treated as null
          const shouldBeNull = marketValueResult.estimatedValue < 10 || 
                              (marketValueResult.method === 'position-estimate' && 
                               marketValueResult.confidence === 'low');
          
          const marketEstimate = shouldBeNull ? null : marketValueResult.estimatedValue;
          
          console.log(`Player ${player.id} (${player.first_name} ${player.last_name}): $${marketValueResult.estimatedValue} -> ${marketEstimate === null ? 'NULL' : '$' + marketEstimate}`);
          
          // Update database
          const { error: updateError } = await supabase
            .from('players')
            .update({
              market_value_estimate: marketEstimate,
              market_value_low: marketEstimate !== null ? marketValueResult.priceRange.low : null,
              market_value_high: marketEstimate !== null ? marketValueResult.priceRange.high : null,
              market_value_confidence: marketEstimate !== null ? marketValueResult.confidence : null,
              market_value_method: marketEstimate !== null ? marketValueResult.method : null,
              market_value_sample_size: marketValueResult.sampleSize,
              market_value_based_on: marketEstimate !== null ? marketValueResult.basedOn : null,
              market_value_updated_at: new Date().toISOString(),
              market_value_calculated_at: new Date().toISOString(),
              sync_stage: 'market_calculated',
            })
            .eq('id', player.id);
          
          if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
          }
          
          return { playerId: player.id, success: true };
        })
      );
      
      // Process batch results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          totalProcessed++;
        } else {
          totalFailed++;
          errors.push(result.reason.message || 'Unknown error');
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < players.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Fix completed: ${totalProcessed} processed, ${totalFailed} failed`);
    
    return NextResponse.json({
      success: totalFailed === 0,
      message: `Processed ${totalProcessed} players, ${totalFailed} failed`,
      processed: totalProcessed,
      failed: totalFailed,
      errors: errors.slice(0, 5) // Return first 5 errors only
    });
    
  } catch (error) {
    console.error('💥 Fix zero values failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: 'Fix zero values failed',
      error: errorMessage
    }, { status: 500 });
  }
}