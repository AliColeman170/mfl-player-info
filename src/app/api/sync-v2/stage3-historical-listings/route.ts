import { NextRequest, NextResponse } from 'next/server';
import { importHistoricalListings } from '@/lib/sync-v2/stages/historical-listings';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 3: Historical Listings Import');
    
    const result = await importHistoricalListings();
    
    return NextResponse.json({
      stage: 'stage3-historical-listings',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 3 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage3-historical-listings',
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
    stage: 'stage3-historical-listings',
    description: 'One-time import of all historical listings data',
    method: 'POST',
    maxDuration: '10 minutes',
    isOneTime: true,
  });
}