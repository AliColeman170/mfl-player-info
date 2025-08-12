import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes - simplified approach

export async function POST(request: NextRequest) {
  try {
    console.log(`[API] Full sync endpoint called - simplified sequential approach`);
    const { searchParams } = new URL(request.url);
    const syncType = searchParams.get('type') || 'daily';
    
    const startTime = Date.now();
    const stageResults: any = {};
    const errors: string[] = [];
    let overallSuccess = true;
    
    console.log(`[API] Starting sequential sync (type: ${syncType})`);
    
    // Stage 1: Players Import
    try {
      console.log(`[API] Running Stage 1: Players Import`);
      const playersResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync-v2/stage1-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPages: 2 }),
      });
      
      const playersResult = await playersResponse.json();
      stageResults.players_import = playersResult;
      
      if (!playersResult.success) {
        errors.push(`Players import failed: ${playersResult.error}`);
        overallSuccess = false;
      }
    } catch (error) {
      const errorMsg = `Players import error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      overallSuccess = false;
      stageResults.players_import = { success: false, error: errorMsg };
    }
    
    // Stage 2: Sales Sync
    try {
      console.log(`[API] Running Stage 2: Sales Sync`);
      const salesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync-v2/stage2-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const salesResult = await salesResponse.json();
      stageResults.sales = salesResult;
      
      if (!salesResult.success) {
        errors.push(`Sales sync failed: ${salesResult.error}`);
        overallSuccess = false;
      }
    } catch (error) {
      const errorMsg = `Sales sync error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      overallSuccess = false;
      stageResults.sales = { success: false, error: errorMsg };
    }
    
    // Stage 3: Market Values
    try {
      console.log(`[API] Running Stage 3: Market Values`);
      const marketResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync-v2/stage3-market-values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const marketResult = await marketResponse.json();
      stageResults.market_values = marketResult;
      
      if (!marketResult.success) {
        errors.push(`Market values failed: ${marketResult.error}`);
        overallSuccess = false;
      }
    } catch (error) {
      const errorMsg = `Market values error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      overallSuccess = false;
      stageResults.market_values = { success: false, error: errorMsg };
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    return NextResponse.json({
      syncType,
      success: overallSuccess,
      duration,
      stageResults,
      errors,
      message: overallSuccess ? 'Full sync completed successfully' : 'Full sync completed with errors',
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
    description: 'Run the complete 3-stage sync orchestrator',
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
      { name: 'sales', isOneTime: false, required: true },
      { name: 'market_values', isOneTime: false, required: true },
    ],
  });
}