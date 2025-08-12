import { NextRequest, NextResponse } from 'next/server';
import { calculateMarketValues } from '@/lib/sync-v2/stages/market-values';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 3: Market Value Calculation');
    
    // Parse request body for options (for testing)
    const body = await request.json().catch(() => ({}));
    const options = {
      batchSize: body.batchSize || 5000,
      skipSummaryRefresh: body.skipSummaryRefresh || false,
    };
    
    const result = await calculateMarketValues(options);
    
    return NextResponse.json({
      stage: 'stage3-market-values',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 3 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage3-market-values',
        error: errorMessage,
        duration: 0,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: [errorMessage],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    stage: 'stage3-market-values',
    description: 'Calculate market values for all players using imported sales data',
    method: 'POST',
    maxDuration: '10 minutes',
  });
}