import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SyncStageStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  isOneTime: boolean;
  recordsProcessed?: number;
}

export async function GET() {
  try {
    // Get sync stage statuses
    const { data: stages } = await supabase
      .from('sync_stages')
      .select('stage_name, status, is_one_time, last_run_at')
      .order('stage_order');

    // Get recent executions for each stage
    const { data: recentExecutions } = await supabase
      .from('sync_executions')
      .select('stage_name, status, records_processed, started_at')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('started_at', { ascending: false });

    // Check if any sync is currently running
    const { data: runningExecutions } = await supabase
      .from('sync_executions')
      .select('id, stage_name, started_at')
      .eq('status', 'running')
      .order('started_at', { ascending: false });

    const isRunning = (runningExecutions?.length || 0) > 0;
    const currentExecutionId = runningExecutions?.[0]?.id || null;

    // Map stage definitions
    const stageDefinitions = [
      { name: 'players_import', displayName: 'Players Import', isOneTime: false },
      { name: 'sales_historical', displayName: 'Historical Sales', isOneTime: true },
      { name: 'listings_historical', displayName: 'Historical Listings', isOneTime: true },
      { name: 'market_values', displayName: 'Market Values', isOneTime: false },
      { name: 'sales_live', displayName: 'Live Sales', isOneTime: false },
      { name: 'listings_live', displayName: 'Live Listings', isOneTime: false },
    ];

    const mappedStages: SyncStageStatus[] = stageDefinitions.map(def => {
      const stageData = stages?.find(s => s.stage_name === def.name);
      const recentExecution = recentExecutions?.find(e => e.stage_name === def.name);
      
      // Determine status
      let status: SyncStageStatus['status'] = 'pending';
      if (runningExecutions?.some(e => e.stage_name === def.name)) {
        status = 'running';
      } else if (stageData?.status === 'completed') {
        status = 'completed';
      } else if (stageData?.status === 'failed' || recentExecution?.status === 'failed' || recentExecution?.status === 'cancelled') {
        status = 'failed';
      }

      return {
        name: def.name,
        displayName: def.displayName,
        status,
        lastRun: stageData?.last_run_at || recentExecution?.started_at || undefined,
        recordsProcessed: recentExecution?.records_processed || undefined,
        isOneTime: def.isOneTime,
      };
    });

    // Get last full sync
    const { data: lastFullSyncConfig } = await supabase
      .from('sync_config')
      .select('config_value')
      .eq('config_key', 'last_full_sync_completed')
      .single();

    return NextResponse.json({
      stages: mappedStages,
      lastFullSync: lastFullSyncConfig?.config_value || undefined,
      isRunning,
      currentExecutionId,
      runningStages: runningExecutions?.map(e => e.stage_name) || [],
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      {
        stages: [],
        isRunning: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}