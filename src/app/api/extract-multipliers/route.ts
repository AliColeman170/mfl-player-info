import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the full 3D analysis first
    const analysisResponse = await fetch('http://localhost:3000/api/analyze-3d-market');
    const analysisData = await analysisResponse.json();
    
    if (!analysisData.success) {
      throw new Error('Failed to get 3D market analysis');
    }
    
    const { multiplierMatrix } = analysisData.analysis;
    
    // Extract a clean multiplier table for each position
    const cleanMultipliers: Record<string, Record<string, Record<string, number>>> = {};
    
    multiplierMatrix.forEach((posData: any) => {
      const position = posData.position;
      cleanMultipliers[position] = {};
      
      posData.ageBreakdown.forEach((ageData: any) => {
        const ageRange = ageData.ageRange;
        cleanMultipliers[position][ageRange] = {};
        
        ageData.overallBreakdown.forEach((overallData: any) => {
          const overallRange = overallData.overallRange;
          if (overallData.multiplier !== null && overallData.count >= 2) { // Only include with sufficient data
            cleanMultipliers[position][ageRange][overallRange] = overallData.multiplier;
          }
        });
      });
    });
    
    // Create a summary table showing coverage
    const coverageByOverall: Record<string, { positions: number; totalSales: number }> = {};
    
    multiplierMatrix.forEach((posData: any) => {
      posData.ageBreakdown.forEach((ageData: any) => {
        ageData.overallBreakdown.forEach((overallData: any) => {
          if (overallData.count > 0) {
            const overallRange = overallData.overallRange;
            if (!coverageByOverall[overallRange]) {
              coverageByOverall[overallRange] = { positions: 0, totalSales: 0 };
            }
            coverageByOverall[overallRange].positions += 1;
            coverageByOverall[overallRange].totalSales += overallData.count;
          }
        });
      });
    });
    
    // Find best baseline (most data coverage)
    const overallRanges = Object.keys(coverageByOverall).sort((a, b) => 
      coverageByOverall[b].totalSales - coverageByOverall[a].totalSales
    );
    
    const bestDataRange = overallRanges[0];
    
    return NextResponse.json({
      success: true,
      data: {
        cleanMultipliers,
        coverageByOverall,
        bestDataRange,
        recommendations: {
          baseline: `Use ${bestDataRange} OVR, 23-27 age, ST/CM position as baseline (1.0)`,
          coverage: `Best data coverage in ${bestDataRange} with ${coverageByOverall[bestDataRange]?.totalSales} sales`
        }
      }
    });
    
  } catch (error) {
    console.error('💥 Multiplier extraction failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      message: 'Multiplier extraction failed',
      error: errorMessage
    }, { status: 500 });
  }
}