import { NextRequest, NextResponse } from 'next/server';
import { syncLiveListings } from '@/lib/sync-v2/stages/live-listings';

export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 6: Live Listings Sync');
    
    const result = await syncLiveListings();
    
    return NextResponse.json({
      stage: 'stage6-live-listings',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 6 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage6-live-listings',
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
    stage: 'stage6-live-listings',
    description: 'Sync current listings data since last sync (incremental)',
    method: 'POST',
    maxDuration: '5 minutes',
    isIncremental: true,
  });
}