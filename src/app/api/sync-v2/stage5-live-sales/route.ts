import { NextRequest, NextResponse } from 'next/server';
import { syncLiveSales } from '@/lib/sync-v2/stages/live-sales';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 5: Live Sales Sync');
    
    const result = await syncLiveSales();
    
    return NextResponse.json({
      stage: 'stage5-live-sales',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 5 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage5-live-sales',
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
    stage: 'stage5-live-sales',
    description: 'Sync new sales data since last sync (incremental)',
    method: 'POST',
    maxDuration: '5 minutes',
    isIncremental: true,
  });
}