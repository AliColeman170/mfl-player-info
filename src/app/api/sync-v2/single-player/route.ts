import { NextRequest, NextResponse } from 'next/server';
import { importMissingPlayer } from '@/lib/sync-v2/core';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    const res = await request.json();

    if (!res.playerId) {
      return NextResponse.json(
        { success: false, error: 'playerId is required' },
        { status: 400 }
      );
    }
    console.log(`[API] Single Player Import: Player ID ${res.playerId}`);

    const result = await importMissingPlayer(res.playerId);

    return NextResponse.json({
      stage: 'single-player',
      success: result,
    });
  } catch (error) {
    console.error('[API] Single Player Import error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        stage: 'single-player',
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
    stage: 'single-player',
    description:
      'Import player with basic data only (no market value calculations)',
    method: 'POST',
    maxDuration: '10 minutes',
  });
}
