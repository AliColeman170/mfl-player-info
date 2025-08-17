'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/UI/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import {
  PlayIcon,
  Square,
  RefreshCcwIcon,
  Loader2,
  SquareIcon,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WorkflowExecution {
  id: string;
  workflow_run_id: string;
  workflow_name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  progress: {
    phase?: string;
    totalFetched?: number;
    totalProcessed?: number;
    totalFailed?: number;
    progressPercent?: number;
    currentPage?: number;
  };
  total_steps: number;
  completed_steps: number;
}

export function UpstashWorkflowControls() {
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_SITE_URL || 'http://localhost:3000';

  // Use React Query to fetch workflow status from Supabase directly
  const {
    data: workflows = [],
    isLoading: refreshing,
    refetch,
  } = useQuery({
    queryKey: ['upstash-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upstash_workflow_executions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Failed to fetch workflows:', error);
        toast.error('Failed to fetch workflow status');
        return [];
      }

      return data as WorkflowExecution[];
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchIntervalInBackground: true,
  });

  const workflowOptions = [
    {
      name: 'import-all-players',
      label: 'Import All Players',
      description: 'Import all player types in parallel',
    },
    {
      name: 'import-sales',
      label: 'Import Sales',
      description: 'Import sales data incrementally',
    },
    {
      name: 'update-market-values',
      label: 'Update Market Values',
      description: 'Recalculate all market values',
    },
  ];

  const triggerWorkflow = async (workflowName: string) => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_SITE_URL || 'http://localhost:3000';

      console.log(
        `Triggering workflow: ${workflowName} at ${baseUrl}/api/upstash/trigger`
      );

      const response = await fetch(`${baseUrl}/api/upstash/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || 'Failed to trigger workflow'
        );
      }

      toast.success(`${workflowName} started successfully!`);
      console.log(`Workflow started:`, result);

      // Refresh status to show new workflow
      await refetch();
    } catch (error) {
      console.error(`Failed to start ${workflowName}:`, error);
      toast.error(
        `Failed to start ${workflowName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelWorkflow = async (
    workflowRunId: string,
    workflowName: string
  ) => {
    try {
      const response = await fetch(`${baseUrl}/api/upstash/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowRunId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || 'Failed to cancel workflow'
        );
      }

      toast.success(`${workflowName} cancelled successfully!`);

      // Refresh status to update cancelled workflow
      await refetch();
    } catch (error) {
      console.error(`Failed to cancel ${workflowName}:`, error);
      toast.error(
        `Failed to cancel ${workflowName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const cancelAllWorkflows = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/upstash/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowRunId: 'all' }), // Sending 'all' to cancel all workflows
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || 'Failed to cancel workflows'
        );
      }

      toast.success('All workflows cancelled successfully!');

      // Refresh status to update cancelled workflows
      await refetch();
    } catch (error) {
      console.error('Failed to cancel workflows:', error);
      toast.error(
        `Failed to cancel workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600)
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <div className='space-y-6'>
      {/* Workflow Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <PlayIcon className='h-5 w-5' />
            Start Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {workflowOptions.map((workflow) => (
              <div key={workflow.name} className='rounded-lg border p-3'>
                <div className='mb-2'>
                  <h4 className='text-sm font-medium'>{workflow.label}</h4>
                  <p className='mt-1 text-xs text-gray-600'>
                    {workflow.description}
                  </p>
                </div>
                <Button
                  size='sm'
                  onClick={() => triggerWorkflow(workflow.name)}
                  disabled={loading}
                  className='w-full'
                >
                  {loading ? 'Starting...' : 'Start'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span className='flex items-center gap-2'>
              <RefreshCcwIcon className='h-5 w-5' />
              Workflow Status
            </span>
            <div className='flex items-center gap-2'>
              <Button
                variant='destructive'
                size='sm'
                onClick={cancelAllWorkflows}
                disabled={
                  workflows.filter((w) => w.status === 'running').length === 0
                }
              >
                <XIcon className='size-4' />
                Cancel All
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => refetch()}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>
              No workflows running or recently completed
            </div>
          ) : (
            <div className='space-y-4'>
              {workflows.map((workflow) => (
                <div key={workflow.id} className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4 className='font-semibold'>
                        {workflow.workflow_name
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h4>

                      <p className='text-muted-foreground text-sm'>
                        Started{' '}
                        {formatDuration(
                          workflow.started_at,
                          workflow.completed_at
                        )}
                        {workflow.status === 'running'
                          ? ' ago'
                          : ` ago • Duration: ${formatDuration(workflow.started_at, workflow.completed_at)}`}
                      </p>

                      {workflow.progress && (
                        <p className='text-muted-foreground/60 text-xs/5'>
                          {workflow.progress.totalFetched &&
                            (workflow.progress.totalFetched?.toLocaleString() ||
                              '0') + ' Fetched • '}
                          {workflow.progress.totalProcessed &&
                            (workflow.progress.totalProcessed?.toLocaleString() ||
                              '0') + ' Processed • '}
                          {workflow.progress.totalProcessed &&
                            (workflow.progress.totalFailed?.toLocaleString() ||
                              '0') + ' Failed'}
                        </p>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>
                      {workflow.status === 'running' && (
                        <>
                          <Loader2 className='text-primary size-4 animate-spin' />
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() =>
                              cancelWorkflow(
                                workflow.workflow_run_id,
                                workflow.workflow_name
                              )
                            }
                          >
                            <XIcon />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {workflow.error_message && (
                    <div className='mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700'>
                      <strong>Error:</strong> {workflow.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
