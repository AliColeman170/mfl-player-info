import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Analyzing market factors: age, overall, position...');
    
    // Get all sales data with player characteristics
    const { data: salesData, error } = await supabase
      .from('sales')
      .select('price, player_age, player_overall, player_position, purchase_date_time')
      .eq('status', 'BOUGHT')
      .gte('price', 50) // Focus on meaningful transactions
      .not('player_age', 'is', null)
      .not('player_overall', 'is', null)
      .not('player_position', 'is', null)
      .not('purchase_date_time', 'is', null)
      .gte('purchase_date_time', Date.now() - (180 * 24 * 60 * 60 * 1000)) // Last 180 days
      .order('purchase_date_time', { ascending: false })
      .limit(5000); // Sample of recent sales
    
    if (error) {
      throw new Error(`Failed to fetch sales data: ${error.message}`);
    }
    
    if (!salesData || salesData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No sales data found'
      });
    }
    
    console.log(`Found ${salesData.length} recent sales for analysis`);
    
    // Group sales by overall rating ranges
    const overallRanges = [
      { min: 95, max: 99, label: '95-99 OVR' },
      { min: 90, max: 94, label: '90-94 OVR' },
      { min: 85, max: 89, label: '85-89 OVR' },
      { min: 80, max: 84, label: '80-84 OVR' },
      { min: 75, max: 79, label: '75-79 OVR' },
      { min: 70, max: 74, label: '70-74 OVR' },
    ];
    
    // Group sales by age ranges
    const ageRanges = [
      { min: 16, max: 20, label: '16-20 years' },
      { min: 21, max: 25, label: '21-25 years' },
      { min: 26, max: 30, label: '26-30 years' },
      { min: 31, max: 35, label: '31-35 years' },
    ];
    
    // Get most common positions
    const positionCounts = salesData.reduce((acc, sale) => {
      acc[sale.player_position] = (acc[sale.player_position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topPositions = Object.entries(positionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([pos]) => pos);
    
    // Analyze price by overall rating
    const overallAnalysis = overallRanges.map(range => {
      const rangeSales = salesData.filter(sale => 
        sale.player_overall >= range.min && sale.player_overall <= range.max
      );
      
      if (rangeSales.length === 0) return { ...range, count: 0, avgPrice: 0, medianPrice: 0 };
      
      const prices = rangeSales.map(s => s.price).sort((a, b) => a - b);
      const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      return {
        ...range,
        count: rangeSales.length,
        avgPrice,
        medianPrice,
        samplePrices: prices.slice(0, 5) // First 5 prices for reference
      };
    });
    
    // Analyze price by age WITHIN same overall rating brackets (this is the key!)
    const ageAnalysis = ageRanges.map(range => {
      const rangeSales = salesData.filter(sale => 
        sale.player_age >= range.min && sale.player_age <= range.max
      );
      
      if (rangeSales.length === 0) return { ...range, count: 0, avgPrice: 0, medianPrice: 0 };
      
      const prices = rangeSales.map(s => s.price).sort((a, b) => a - b);
      const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      // Also analyze within high-rated players (85+ OVR) to see age premium
      const highRatedInAge = rangeSales.filter(sale => sale.player_overall >= 85);
      const highRatedAvg = highRatedInAge.length > 0 
        ? Math.round(highRatedInAge.reduce((sum, sale) => sum + sale.price, 0) / highRatedInAge.length)
        : 0;
      
      return {
        ...range,
        count: rangeSales.length,
        avgPrice,
        medianPrice,
        highRated85Plus: {
          count: highRatedInAge.length,
          avgPrice: highRatedAvg
        }
      };
    });
    
    // Analyze price by position
    const positionAnalysis = topPositions.map(position => {
      const posSales = salesData.filter(sale => sale.player_position === position);
      const prices = posSales.map(s => s.price).sort((a, b) => a - b);
      const avgPrice = Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length);
      const medianPrice = prices[Math.floor(prices.length / 2)];
      
      return {
        position,
        count: posSales.length,
        avgPrice,
        medianPrice
      };
    });
    
    // Cross-factor analysis: High-rated players across positions
    const crossAnalysis = topPositions.map(position => {
      const highRatedSales = salesData.filter(sale => 
        sale.player_position === position && 
        sale.player_overall >= 90
      );
      
      const midRatedSales = salesData.filter(sale => 
        sale.player_position === position && 
        sale.player_overall >= 80 && 
        sale.player_overall < 90
      );
      
      const highPrices = highRatedSales.map(s => s.price);
      const midPrices = midRatedSales.map(s => s.price);
      
      const highAvg = highPrices.length > 0 ? Math.round(highPrices.reduce((sum, p) => sum + p, 0) / highPrices.length) : 0;
      const midAvg = midPrices.length > 0 ? Math.round(midPrices.reduce((sum, p) => sum + p, 0) / midPrices.length) : 0;
      
      const premiumMultiplier = midAvg > 0 ? (highAvg / midAvg) : 0;
      
      return {
        position,
        highRated_90plus: {
          count: highRatedSales.length,
          avgPrice: highAvg
        },
        midRated_80to89: {
          count: midRatedSales.length,
          avgPrice: midAvg
        },
        premiumMultiplier: Math.round(premiumMultiplier * 100) / 100
      };
    });
    
    // Age premium analysis within same overall brackets
    const agePremiumAnalysis = overallRanges
      .filter(range => range.min >= 80) // Focus on higher-rated players
      .map(overallRange => {
        // Get all sales in this overall range
        const overallSales = salesData.filter(sale => 
          sale.player_overall >= overallRange.min && 
          sale.player_overall <= overallRange.max
        );
        
        if (overallSales.length < 10) return null; // Skip if too few samples
        
        // Group by age ranges within this overall bracket
        const ageGroupsInOverall = ageRanges.map(ageRange => {
          const ageGroupSales = overallSales.filter(sale =>
            sale.player_age >= ageRange.min && sale.player_age <= ageRange.max
          );
          
          if (ageGroupSales.length === 0) return null;
          
          const avgPrice = Math.round(
            ageGroupSales.reduce((sum, sale) => sum + sale.price, 0) / ageGroupSales.length
          );
          
          return {
            ageRange: ageRange.label,
            count: ageGroupSales.length,
            avgPrice
          };
        }).filter(Boolean);
        
        return {
          overallRange: overallRange.label,
          ageBreakdown: ageGroupsInOverall
        };
      }).filter(Boolean);
    
    return NextResponse.json({
      success: true,
      analysis: {
        totalSales: salesData.length,
        dateRange: '180 days',
        overallRatingAnalysis: overallAnalysis,
        ageAnalysis: ageAnalysis,
        positionAnalysis: positionAnalysis,
        crossFactorAnalysis: crossAnalysis,
        agePremiumAnalysis: agePremiumAnalysis
      }
    });
    
  } catch (error) {
    console.error('💥 Market analysis failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: 'Market analysis failed',
      error: errorMessage
    }, { status: 500 });
  }
}