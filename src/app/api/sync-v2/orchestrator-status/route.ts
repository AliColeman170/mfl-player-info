import { NextRequest, NextResponse } from 'next/server';
import { getSyncConfig } from '@/lib/sync-v2/core';

export const maxDuration = 30; // Quick status check

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orchestratorId = searchParams.get('id');
    
    if (!orchestratorId) {
      return NextResponse.json({ error: 'Orchestrator ID required' }, { status: 400 });
    }
    
    // Check if orchestrator state exists
    const stateKey = `orchestrator_state_${orchestratorId}`;
    const stateStr = await getSyncConfig(stateKey);
    
    if (!stateStr || stateStr === '0') {
      return NextResponse.json({
        orchestratorId,
        isRunning: false,
        state: null,
      });
    }
    
    try {
      const state = JSON.parse(stateStr);
      return NextResponse.json({
        orchestratorId,
        isRunning: !state.isComplete,
        state,
      });
    } catch (error) {
      return NextResponse.json({
        orchestratorId,
        isRunning: false,
        state: null,
        error: 'Failed to parse state',
      });
    }
    
  } catch (error) {
    console.error('[API] Orchestrator status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}