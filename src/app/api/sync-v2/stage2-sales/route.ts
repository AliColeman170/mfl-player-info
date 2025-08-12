import { NextRequest, NextResponse } from 'next/server';
import { syncSales } from '@/lib/sync-v2/stages/sales';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 2: Sales Sync');
    
    const result = await syncSales();
    
    return NextResponse.json({
      stage: 'stage2-sales',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 2 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage2-sales',
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
    stage: 'stage2-sales',
    description: 'Sync all sales data from MFL API (incremental or complete import based on existing data)',
    method: 'POST',
    maxDuration: '10 minutes',
    isOneTime: false,
  });
}