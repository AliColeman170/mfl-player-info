'use client';

import React from 'react';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/UI/card';
import { Badge } from '@/components/UI/badge';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Database,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SyncStatusActions } from './SyncStatusActions';

function getStatusIcon(status: string) {
  switch (status) {
    case 'running':
      return <Loader2 className='text-primary size-4 animate-spin' />;
    case 'completed':
      return <CheckCircle className='size-4 text-green-500' />;
    case 'failed':
      return <XCircle className='size-4 text-red-500' />;
    default:
      return <Clock className='size-4 text-gray-400' />;
  }
}

function getStatusBadge(status: string, isOneTime: boolean) {
  switch (status) {
    case 'running':
      return <Badge>Running</Badge>;
    case 'completed':
      return (
        <Badge variant='outline' className='border-green-200 text-green-600'>
          {isOneTime ? 'Complete' : 'Synced'}
        </Badge>
      );
    case 'failed':
      return <Badge variant='destructive'>Failed</Badge>;
    default:
      return <Badge variant='outline'>Pending</Badge>;
  }
}

export function SyncStatusClient() {
  const { data: syncStatus, isLoading, error } = useSyncStatus();

  if (isLoading && !syncStatus) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <Loader2 className='text-primary size-6 animate-spin' />
          <span className='text-muted-foreground ml-2'>
            Loading sync status...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <XCircle className='size-6 text-red-500' />
          <span className='ml-2 text-red-600'>Failed to load sync status</span>
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return null;
  }

  const { stages, lastFullSync, isRunning, currentExecutionId, runningStages: runningStageNames } = syncStatus;
  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const failedStages = stages.filter((s) => s.status === 'failed').length;
  const runningStagesCount = stages.filter((s) => s.status === 'running').length;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Database className='text-primary size-5' />
            <CardTitle className='text-lg'>Data Sync Status</CardTitle>
          </div>
          {isRunning && (
            <Badge>
              <Loader2 className='animate-spin' />
              Syncing
            </Badge>
          )}
        </div>
        <CardDescription>
          {completedStages}/{stages.length} stages completed
          {failedStages > 0 && ` • ${failedStages} failed`}
          {lastFullSync && (
            <>
              {' '}
              • Last full sync{' '}
              {formatDistanceToNow(new Date(lastFullSync), { addSuffix: true })}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {stages.map((stage) => (
            <div
              key={stage.name}
              className='flex items-center justify-between py-2'
            >
              <div className='flex items-center gap-3'>
                {getStatusIcon(stage.status)}
                <div>
                  <div className='text-sm font-medium'>{stage.displayName}</div>
                  {stage.lastRun && (
                    <div className='text-muted-foreground text-xs'>
                      {formatDistanceToNow(new Date(stage.lastRun), {
                        addSuffix: true,
                      })}
                      {stage.recordsProcessed && (
                        <>
                          {' '}
                          • {stage.recordsProcessed.toLocaleString()} records
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {stage.isOneTime && <Badge variant='secondary'>One-time</Badge>}
                {getStatusBadge(stage.status, stage.isOneTime)}
              </div>
            </div>
          ))}
        </div>

        {(failedStages > 0 || (runningStagesCount === 0 && completedStages === stages.length)) && (
          <div className='mt-4 border-t pt-3'>
            <div className='text-muted-foreground mb-4 flex items-center gap-2 text-xs'>
              {failedStages > 0 ? (
                <>
                  <AlertCircle className='size-3 text-amber-500' />
                  Some syncs failed. Data may be incomplete.
                </>
              ) : (
                <>
                  <CheckCircle className='size-3 text-green-500' />
                  All syncs completed successfully.
                </>
              )}
            </div>
          </div>
        )}

        {/* Sync Actions */}
        <div className='mt-4 border-t pt-3'>
          <SyncStatusActions 
            isRunning={isRunning} 
            currentExecutionId={currentExecutionId}
            runningStages={runningStageNames}
          />
        </div>
      </CardContent>
    </Card>
  );
}
