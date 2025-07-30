import { NextRequest, NextResponse } from 'next/server';
import { importPlayersBasicData } from '@/lib/sync-v2/stages/players-import';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting Stage 1: Players Import');
    
    const result = await importPlayersBasicData();
    
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