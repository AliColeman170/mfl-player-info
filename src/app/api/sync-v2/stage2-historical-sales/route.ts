import { NextRequest, NextResponse } from 'next/server';
import { importHistoricalSales } from '@/lib/sync-v2/stages/historical-sales';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 2: Historical Sales Import');
    
    const result = await importHistoricalSales();
    
    return NextResponse.json({
      stage: 'stage2-historical-sales',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 2 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage2-historical-sales',
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
    stage: 'stage2-historical-sales',
    description: 'One-time import of all historical sales data',
    method: 'POST',
    maxDuration: '10 minutes',
    isOneTime: true,
  });
}