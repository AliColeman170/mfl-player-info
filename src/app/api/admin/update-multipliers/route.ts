import { NextRequest, NextResponse } from 'next/server';
import { updateMarketMultipliers, getLatestUpdateInfo } from '@/services/market-multiplier-updater';

export async function POST(request: NextRequest) {
  try {
    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const { 
      windowDays = 180, 
      minSampleSize = 5, 
      forceUpdate = false 
    } = body;

    console.log('[Admin API] Starting market multiplier update...', {
      windowDays,
      minSampleSize,
      forceUpdate
    });

    // Run the multiplier update
    const result = await updateMarketMultipliers({
      windowDays,
      minSampleSize,
      forceUpdate
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Market multipliers updated successfully',
        runId: result.runId,
        metrics: result.metrics
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to update market multipliers',
        error: result.error,
        runId: result.runId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Admin API] Error updating multipliers:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('[Admin API] Getting multiplier update info...');

    // Get current multiplier status
    const info = await getLatestUpdateInfo();

    return NextResponse.json({
      success: true,
      data: info
    });

  } catch (error) {
    console.error('[Admin API] Error getting multiplier info:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}