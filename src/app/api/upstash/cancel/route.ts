import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/workflow';
import { supabaseAdmin as supabase } from '@/lib/supabase/admin';

const client = new Client({
  baseUrl: process.env.QSTASH_URL!,
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { workflowRunId } = await request.json();

    if (!workflowRunId) {
      return NextResponse.json(
        { error: 'Workflow run ID is required' },
        { status: 400 }
      );
    }

    if (workflowRunId === 'all') {
      // Cancel all workflows
      await client.cancel({ all: true });

      // Update all running workflows in database
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          progress: {
            phase: 'cancelled',
          },
        })
        .eq('status', 'running');

      return NextResponse.json({
        success: true,
        message: 'All workflows cancelled',
      });
    } else {
      // Cancel specific workflow
      await client.cancel({ ids: workflowRunId });

      // Update specific workflow in database
      await supabase
        .from('upstash_workflow_executions')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('workflow_run_id', workflowRunId);

      return NextResponse.json({
        success: true,
        workflowRunId,
      });
    }
  } catch (error) {
    console.error('Failed to cancel workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
