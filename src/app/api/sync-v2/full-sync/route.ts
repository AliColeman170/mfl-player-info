import { NextRequest, NextResponse } from 'next/server';
import { runFullSync, runDailySync, runInitialSetupSync } from '@/lib/sync-v2/orchestrator';

export const maxDuration = 600; // 10 minutes

export async function POST(request: NextRequest) {
  try {
    console.log(`[API] Full sync endpoint called`);
    const { searchParams } = new URL(request.url);
    const syncType = searchParams.get('type') || 'daily';
    
    console.log(`[API] Starting Full Sync (type: ${syncType})`);
    
    let result;
    
    switch (syncType) {
      case 'initial':
        result = await runInitialSetupSync();
        break;
      case 'daily':
        result = await runDailySync();
        break;
      case 'full':
        result = await runFullSync({
          runHistoricalImports: true,
        });
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid sync type. Use: initial, daily, or full',
          },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      syncType,
      totalStages: Object.keys(result.stageResults).length,
      successfulStages: Object.values(result.stageResults).filter((r: any) => r.success).length,
      ...result,
    });
    
  } catch (error) {
    console.error('[API] Full sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        duration: 0,
        stageResults: {},
        errors: [errorMessage],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'full-sync',
    description: 'Run the complete 6-stage sync orchestrator',
    method: 'POST',
    maxDuration: '10 minutes',
    parameters: {
      type: {
        description: 'Sync type',
        options: ['initial', 'daily', 'full'],
        default: 'daily',
      },
    },
    stages: [
      { name: 'players_import', isOneTime: false, required: true },
      { name: 'sales_historical', isOneTime: true, required: false },
      { name: 'listings_historical', isOneTime: true, required: false },
      { name: 'market_values', isOneTime: false, required: true },
      { name: 'sales_live', isOneTime: false, required: true },
      { name: 'listings_live', isOneTime: false, required: true },
    ],
  });
}