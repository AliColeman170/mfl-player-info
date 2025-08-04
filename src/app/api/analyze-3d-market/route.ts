import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Building 3D market model: Age × Position × Overall...');
    
    // Get comprehensive sales data across ALL rating levels using pagination
    const targetSampleSize = 10000;
    const pageSize = 1000;
    let allSalesData: any[] = [];
    let currentOffset = 0;
    
    console.log(`Fetching sales data in batches of ${pageSize}...`);
    
    while (allSalesData.length < targetSampleSize) {
      const { data: batchData, error } = await supabase
        .from('sales')
        .select('price, player_age, player_overall, player_position, purchase_date_time')
        .eq('status', 'BOUGHT')
        .gte('price', 1) // Include all meaningful transactions, even low-value ones
        .not('player_age', 'is', null)
        .not('player_overall', 'is', null)
        .not('player_position', 'is', null)
        .not('purchase_date_time', 'is', null)
        .gte('purchase_date_time', Date.now() - (180 * 24 * 60 * 60 * 1000)) // Last 180 days
        .order('purchase_date_time', { ascending: false })
        .range(currentOffset, currentOffset + pageSize - 1);
      
      if (error) {
        throw new Error(`Failed to fetch sales data: ${error.message}`);
      }
      
      if (!batchData || batchData.length === 0) {
        console.log(`No more data available. Got ${allSalesData.length} total records.`);
        break;
      }
      
      allSalesData = allSalesData.concat(batchData);
      currentOffset += pageSize;
      
      console.log(`Fetched ${allSalesData.length} records so far...`);
      
      // Break if we got less than a full page (means we're at the end)
      if (batchData.length < pageSize) {
        console.log(`Reached end of data. Final count: ${allSalesData.length} records.`);
        break;
      }
    }
    
    const salesData = allSalesData;
    
    if (!salesData || salesData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No sales data found'
      });
    }
    
    console.log(`Found ${salesData.length} recent sales for 3D analysis`);
    
    // Define our analysis dimensions - COMPLETE spectrum
    const overallBrackets = [
      { min: 95, max: 99, label: '95-99' },
      { min: 90, max: 94, label: '90-94' },
      { min: 85, max: 89, label: '85-89' },
      { min: 80, max: 84, label: '80-84' },
      { min: 75, max: 79, label: '75-79' },
      { min: 70, max: 74, label: '70-74' },
      { min: 65, max: 69, label: '65-69' },
      { min: 60, max: 64, label: '60-64' },
      { min: 55, max: 59, label: '55-59' },
      { min: 50, max: 54, label: '50-54' },
    ];
    
    const ageBrackets = [
      { min: 16, max: 22, label: '16-22' },
      { min: 23, max: 27, label: '23-27' },
      { min: 28, max: 32, label: '28-32' },
      { min: 33, max: 40, label: '33-40' },
    ];
    
    // Get top positions with enough data
    const positionCounts = salesData.reduce((acc, sale) => {
      acc[sale.player_position] = (acc[sale.player_position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPositions = Object.entries(positionCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 8)
      .map(([pos, count]) => ({ position: pos, count }));
    
    // Build 3D market matrix: Position × Age × Overall
    const marketMatrix = topPositions.map(({ position }) => {
      const positionData = ageBrackets.map(ageBracket => {
        const ageData = overallBrackets.map(overallBracket => {
          // Find sales matching all three criteria
          const matchingSales = salesData.filter(sale =>
            sale.player_position === position &&
            sale.player_age >= ageBracket.min &&
            sale.player_age <= ageBracket.max &&
            sale.player_overall >= overallBracket.min &&
            sale.player_overall <= overallBracket.max
          );
          
          if (matchingSales.length === 0) {
            return {
              overallRange: overallBracket.label,
              count: 0,
              avgPrice: null,
              medianPrice: null,
              priceRange: null
            };
          }
          
          const prices = matchingSales.map(s => s.price).sort((a, b) => a - b);
          const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
          const medianPrice = prices[Math.floor(prices.length / 2)];
          const minPrice = prices[0];
          const maxPrice = prices[prices.length - 1];
          
          return {
            overallRange: overallBracket.label,
            count: matchingSales.length,
            avgPrice,
            medianPrice,
            priceRange: { min: minPrice, max: maxPrice },
            samplePrices: prices.slice(0, 3) // Show first 3 prices as examples
          };
        });
        
        return {
          ageRange: ageBracket.label,
          overallBreakdown: ageData
        };
      });
      
      return {
        position,
        ageBreakdown: positionData
      };
    });
    
    // Calculate relative multipliers using a reference point
    // Use 75-79 OVR, 23-27 age, CM position as baseline (1.0) - more common bracket
    let baselineRef = marketMatrix
      .find(p => p.position === 'CM')
      ?.ageBreakdown.find(a => a.ageRange === '23-27')
      ?.overallBreakdown.find(o => o.overallRange === '75-79');
    
    // Fallback to ST if CM doesn't have data
    if (!baselineRef?.avgPrice) {
      baselineRef = marketMatrix
        .find(p => p.position === 'ST')
        ?.ageBreakdown.find(a => a.ageRange === '23-27')
        ?.overallBreakdown.find(o => o.overallRange === '75-79');
    }
    
    const baselinePrice = baselineRef?.avgPrice || 75; // Conservative fallback
    
    // Calculate multipliers for each combination
    const multiplierMatrix = marketMatrix.map(posData => ({
      position: posData.position,
      ageBreakdown: posData.ageBreakdown.map(ageData => ({
        ageRange: ageData.ageRange,
        overallBreakdown: ageData.overallBreakdown.map(overallData => ({
          overallRange: overallData.overallRange,
          count: overallData.count,
          avgPrice: overallData.avgPrice,
          multiplier: overallData.avgPrice ? 
            Math.round((overallData.avgPrice / baselinePrice) * 100) / 100 : 
            null
        }))
      }))
    }));
    
    // Summary statistics for key insights
    const insights = {
      totalDataPoints: salesData.length,
      baselineReference: `ST, 23-27 age, 85-89 OVR = $${baselinePrice}`,
      topPositionsByVolume: topPositions.slice(0, 5),
      
      // Age premium patterns across positions
      agePremiumPatterns: topPositions.slice(0, 4).map(({ position }) => {
        const posData = marketMatrix.find(p => p.position === position);
        if (!posData) return null;
        
        // Find 85-89 OVR bracket across different ages for this position
        const ageComparison = posData.ageBreakdown
          .map(ageGroup => {
            const overallData = ageGroup.overallBreakdown.find(o => o.overallRange === '85-89');
            return overallData?.avgPrice ? {
              ageRange: ageGroup.ageRange,
              avgPrice: overallData.avgPrice,
              count: overallData.count
            } : null;
          })
          .filter(Boolean);
        
        return {
          position,
          ageComparison
        };
      }).filter(Boolean),
      
      // Position premium patterns at different overall levels
      positionPremiumPatterns: overallBrackets.slice(0, 3).map(bracket => {
        const positionComparison = topPositions.slice(0, 6).map(({ position }) => {
          const posData = marketMatrix.find(p => p.position === position);
          if (!posData) return null;
          
          // Find 23-27 age bracket for this position and overall range
          const ageData = posData.ageBreakdown.find(a => a.ageRange === '23-27');
          const overallData = ageData?.overallBreakdown.find(o => o.overallRange === bracket.label);
          
          return overallData?.avgPrice ? {
            position,
            avgPrice: overallData.avgPrice,
            count: overallData.count
          } : null;
        }).filter(Boolean);
        
        return {
          overallRange: bracket.label,
          positionComparison
        };
      })
    };
    
    return NextResponse.json({
      success: true,
      analysis: {
        marketMatrix,
        multiplierMatrix,
        insights
      }
    });
    
  } catch (error) {
    console.error('💥 3D Market analysis failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: '3D Market analysis failed',
      error: errorMessage
    }, { status: 500 });
  }
}