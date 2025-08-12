import { NextRequest, NextResponse } from 'next/server';
import { importPlayersBasicDataChunk } from '@/lib/sync-v2/stages/players-import';

export const maxDuration = 240; // 4 minutes (safely under Vercel's 5min limit)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { 
      maxPages = 2, 
      continueFrom 
    } = body;
    
    // Single chunk mode
    console.log('[API] Starting Stage 1: Players Import Chunk', { maxPages, continueFrom });
    
    const result = await importPlayersBasicDataChunk({
      maxPagesPerChunk: maxPages,
      continueFrom,
    });
    
    return NextResponse.json({
      stage: 'stage1-players',
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Stage 1 error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        stage: 'stage1-players',
        error: errorMessage,
        duration: 0,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: [errorMessage],
        isComplete: false,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    stage: 'stage1-players',
    description: 'Import players with basic data only (no market value calculations)',
    method: 'POST',
    maxDuration: '10 minutes',
  });
}