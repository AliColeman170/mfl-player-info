import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('[Stop Sync] Received stop sync request');

    // Get any running sync executions
    const { data: runningExecutions, error: fetchError } = await supabase
      .from('sync_executions')
      .select('*')
      .eq('status', 'running')
      .order('started_at', { ascending: false });

    if (fetchError) {
      console.error('[Stop Sync] Error fetching running executions:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch running syncs' },
        { status: 500 }
      );
    }

    if (!runningExecutions || runningExecutions.length === 0) {
      console.log('[Stop Sync] No running syncs found');
      return NextResponse.json({
        success: true,
        message: 'No running syncs to stop',
        stoppedExecutions: 0,
      });
    }

    console.log(`[Stop Sync] Found ${runningExecutions.length} running executions to stop`);

    // Update all running executions to cancelled status
    const { data: updatedExecutions, error: updateError } = await supabase
      .from('sync_executions')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: 'Sync manually cancelled by user',
      })
      .eq('status', 'running')
      .select();

    if (updateError) {
      console.error('[Stop Sync] Error updating executions:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to stop running syncs' },
        { status: 500 }
      );
    }

    const stoppedCount = updatedExecutions?.length || 0;
    console.log(`[Stop Sync] Successfully stopped ${stoppedCount} sync executions`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully stopped ${stoppedCount} running sync${stoppedCount === 1 ? '' : 's'}`,
      stoppedExecutions: stoppedCount,
      executionIds: updatedExecutions?.map(e => e.id) || [],
    });

  } catch (error) {
    console.error('[Stop Sync] Unexpected error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, error: `Failed to stop sync: ${errorMsg}` },
      { status: 500 }
    );
  }
}