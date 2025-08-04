import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking current state of players with 0 market values...');
    
    // Count total players with 0 market values
    const { count: zeroCount, error: zeroError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('market_value_estimate', 0)
      .not('market_value_updated_at', 'is', null);
    
    if (zeroError) {
      throw new Error(`Error counting zero values: ${zeroError.message}`);
    }
    
    // Get sample of players with 0 values to analyze
    const { data: sampleZeros, error: sampleError } = await supabase
      .from('players')
      .select(`
        id, first_name, last_name, overall, age, primary_position,
        market_value_estimate, market_value_confidence, market_value_method,
        market_value_sample_size, market_value_updated_at, sync_stage
      `)
      .eq('market_value_estimate', 0)
      .not('market_value_updated_at', 'is', null)
      .order('overall', { ascending: false })
      .limit(10);
    
    if (sampleError) {
      throw new Error(`Error fetching sample: ${sampleError.message}`);
    }
    
    // Check if any were recently updated (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentlyUpdated, error: recentError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('market_value_estimate', 0)
      .gte('market_value_updated_at', oneHourAgo);
    
    if (recentError) {
      throw new Error(`Error counting recent updates: ${recentError.message}`);
    }
    
    // Check for any players that were marked as 'market_fixed' 
    const { count: fixedCount, error: fixedError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('sync_stage', 'market_calculated')
      .gte('market_value_updated_at', oneHourAgo);
    
    console.log(`Found ${zeroCount} players with 0 market values`);
    console.log(`${recentlyUpdated} were updated in the last hour`);
    console.log(`${fixedCount} have sync_stage = 'market_calculated' from last hour`);
    
    return NextResponse.json({
      success: true,
      zeroValueCount: zeroCount || 0,
      recentlyUpdatedCount: recentlyUpdated || 0,
      recentlyCalculatedCount: fixedCount || 0,
      samplePlayers: sampleZeros || [],
      message: `Found ${zeroCount} players with 0 market values, ${recentlyUpdated} updated recently`
    });
    
  } catch (error) {
    console.error('💥 Check failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: 'Check failed',
      error: errorMessage
    }, { status: 500 });
  }
}