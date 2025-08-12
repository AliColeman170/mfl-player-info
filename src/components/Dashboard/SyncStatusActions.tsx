'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/UI/button';
import {
  Play,
  Loader2,
  RefreshCw,
  Database,
  Users,
  TrendingUp,
  ShoppingCart,
  Activity,
  Square,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatusActionsProps {
  isRunning: boolean;
  currentExecutionId?: number | null;
  runningStages?: string[];
}

const STAGE_CONFIGS = [
  {
    name: 'stage1-players',
    apiName: 'players_import',
    displayName: 'Players Import',
    icon: Users,
    description: 'Import basic player data (automatically chunked for Vercel)',
  },
  {
    name: 'stage2-sales',
    apiName: 'sales',
    displayName: 'Sales Sync',
    icon: ShoppingCart,
    description: 'Sync all sales data (incremental or complete import)',
  },
  {
    name: 'stage3-market-values',
    apiName: 'market_values',
    displayName: 'Market Values',
    icon: Activity,
    description: 'Calculate market values using comprehensive pricing model',
  },
];

export function SyncStatusActions({
  isRunning,
  currentExecutionId,
  runningStages = [],
}: SyncStatusActionsProps) {
  const queryClient = useQueryClient();
  const [loadingStages, setLoadingStages] = useState<Set<string>>(new Set());
  const [fullSyncLoading, setFullSyncLoading] = useState(false);
  const [syncExecutionId, setSyncExecutionId] = useState<number | null>(null);
  const [stopping, setStopping] = useState(false);
  const [multiplierUpdateLoading, setMultiplierUpdateLoading] = useState(false);

  // Show full sync loading if we have a running full_sync or if local state indicates loading
  const isFullSyncRunning =
    runningStages.includes('full_sync') || fullSyncLoading;

  // Update local execution ID when API provides one
  React.useEffect(() => {
    if (currentExecutionId && !syncExecutionId) {
      setSyncExecutionId(currentExecutionId);
    }
  }, [currentExecutionId, syncExecutionId]);

  const runChunkedImport = async (displayName: string, toastId?: string) => {
    let continueFrom: any = null;
    let totalProcessed = 0;
    let chunkNumber = 1;
    let isComplete = false;

    while (!isComplete) {
      try {
        console.log(`[Chunked Import] Running chunk ${chunkNumber}...`);
        
        const response = await fetch(`/api/sync-v2/stage1-players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maxPages: 2, // 2 pages per chunk (~3000 players)
            continueFrom,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || result.errors?.[0] || 'Chunk failed');
        }

        totalProcessed += result.recordsProcessed || 0;
        isComplete = result.isComplete;
        continueFrom = result.continueFrom;

        // Update progress toast
        const progressMsg = result.totalProgress 
          ? `${Math.round(result.totalProgress.percentage)}% complete (${totalProcessed.toLocaleString()} players)`
          : `Chunk ${chunkNumber} complete (${totalProcessed.toLocaleString()} players)`;

        if (toastId) {
          toast.loading(`${displayName} - ${progressMsg}`, { id: toastId });
        }

        console.log(`[Chunked Import] Chunk ${chunkNumber} complete:`, {
          processed: result.recordsProcessed,
          totalProcessed,
          isComplete,
          hasMore: !!continueFrom,
        });

        chunkNumber++;

        // Brief pause between chunks
        if (!isComplete) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`[Chunked Import] Chunk ${chunkNumber} failed:`, error);
        throw error;
      }
    }

    return {
      success: true,
      recordsProcessed: totalProcessed,
      chunks: chunkNumber - 1,
    };
  };

  const runStage = async (stageName: string, displayName: string) => {
    setLoadingStages((prev) => new Set(prev).add(stageName));

    // Create a persistent toast for progress updates
    const toastId = `${stageName}-${Date.now()}`;
    toast.loading(`Starting ${displayName}...`, { id: toastId });

    try {
      let result: any;

      // Use server-side orchestrator for players import (survives page refreshes)
      if (stageName === 'stage1-players') {
        const response = await fetch(`/api/sync-v2/stage1-players`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            useOrchestrator: true, // Use server-side orchestrator
          }),
        });

        result = await response.json();

        if (result.success) {
          toast.success(`${displayName} completed successfully`, {
            id: toastId,
            description: `Processed ${result.recordsProcessed?.toLocaleString() || 0} players across ${result.metadata?.totalChunks || 1} chunks`,
          });
        }
      } else {
        // Regular single-request stages
        const response = await fetch(`/api/sync-v2/${stageName}`, {
          method: 'POST',
        });

        result = await response.json();

        if (result.success) {
          toast.success(`${displayName} completed successfully`, {
            id: toastId,
            description: `Processed ${result.recordsProcessed?.toLocaleString() || 0} records in ${Math.round((result.duration || 0) / 1000)}s`,
          });
        }
      }

      if (!result.success) {
        toast.error(`${displayName} failed`, {
          id: toastId,
          description: result.errors?.[0] || result.error || 'Unknown error occurred',
        });
      }

      // Invalidate sync status query to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });

    } catch (error) {
      console.error(`Error running ${stageName}:`, error);
      toast.error(`${displayName} failed`, {
        id: toastId,
        description: error instanceof Error ? error.message : 'Network error occurred',
      });

      // Invalidate query even on network errors
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    } finally {
      setLoadingStages((prev) => {
        const next = new Set(prev);
        next.delete(stageName);
        return next;
      });
    }
  };

  const runFullSync = async (type: 'daily' | 'initial' | 'full' = 'daily') => {
    setFullSyncLoading(true);

    try {
      const response = await fetch(`/api/sync-v2/full-sync?type=${type}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Set the execution ID for progress tracking
      if (result.executionId) {
        setSyncExecutionId(result.executionId);
      }

      if (result.success) {
        toast.success(`Full sync (${type}) completed successfully`, {
          description: `${result.successfulStages}/${result.totalStages} stages completed in ${Math.round((result.duration || 0) / 1000)}s`,
        });

        // Clear execution ID and invalidate query
        setTimeout(() => {
          setSyncExecutionId(null);
          queryClient.invalidateQueries({ queryKey: ['sync-status'] });
        }, 3000);
      } else {
        toast.error(`Full sync (${type}) failed`, {
          description:
            result.errors?.[0] || result.error || 'Unknown error occurred',
        });

        // Clear execution ID on failure and invalidate query
        setTimeout(() => {
          setSyncExecutionId(null);
          queryClient.invalidateQueries({ queryKey: ['sync-status'] });
        }, 5000);
      }
    } catch (error) {
      console.error('Error running full sync:', error);
      toast.error('Full sync failed', {
        description:
          error instanceof Error ? error.message : 'Network error occurred',
      });

      // Invalidate query even on network errors
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    } finally {
      setFullSyncLoading(false);
    }
  };

  const stopSync = async () => {
    setStopping(true);

    try {
      const response = await fetch('/api/sync-v2/stop', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Sync stopped successfully', {
          description: result.message,
        });

        // Clear execution ID and all local loading states
        setSyncExecutionId(null);
        setLoadingStages(new Set());
        setFullSyncLoading(false);

        // Force immediate refetch of sync status
        await queryClient.invalidateQueries({ queryKey: ['sync-status'] });
        await queryClient.refetchQueries({ queryKey: ['sync-status'] });
      } else {
        toast.error('Failed to stop sync', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error stopping sync:', error);
      toast.error('Failed to stop sync', {
        description: 'Network error occurred',
      });
    } finally {
      setStopping(false);
    }
  };

  const updateMarketMultipliers = async () => {
    setMultiplierUpdateLoading(true);

    try {
      const response = await fetch('/api/admin/update-multipliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          windowDays: 180, // 6 months
          minSampleSize: 5,
          forceUpdate: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Market multipliers updated successfully', {
          description: `Updated ${result.metrics.combinations_updated} multipliers, added ${result.metrics.combinations_added} new ones`,
        });
      } else {
        toast.error('Failed to update market multipliers', {
          description: result.error || 'Unknown error occurred',
        });
      }
    } catch (error) {
      console.error('Error updating market multipliers:', error);
      toast.error('Failed to update market multipliers', {
        description: 'Network error occurred',
      });
    } finally {
      setMultiplierUpdateLoading(false);
    }
  };

  const isAnyStageLoading = loadingStages.size > 0;
  const isDisabled =
    isRunning ||
    isAnyStageLoading ||
    fullSyncLoading ||
    multiplierUpdateLoading;

  return (
    <div className='space-y-4'>
      {/* Stop Button - Show when sync is running */}
      {isRunning && (
        <div className='flex gap-2'>
          <Button
            onClick={stopSync}
            disabled={stopping}
            size='sm'
            variant='destructive'
            className='flex items-center gap-2'
          >
            {stopping ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Square className='h-4 w-4' />
            )}
            {stopping ? 'Stopping...' : 'Stop Sync'}
          </Button>
        </div>
      )}

      {/* Full Sync Buttons */}
      <div className='flex flex-wrap gap-2'>
        <Button
          onClick={() => runFullSync('daily')}
          disabled={isDisabled}
          size='sm'
          className='disabled:cursor-not-allowed'
        >
          {isFullSyncRunning ? <Loader2 className='animate-spin' /> : <Play />}
          Daily Sync
        </Button>

        <Button
          onClick={() => runFullSync('initial')}
          disabled={isDisabled}
          size='sm'
          variant='outline'
          className='disabled:cursor-not-allowed'
        >
          {isFullSyncRunning ? (
            <Loader2 className='animate-spin' />
          ) : (
            <Database />
          )}
          Initial Setup
        </Button>

        <Button
          onClick={() => runFullSync('full')}
          disabled={isDisabled}
          size='sm'
          variant='outline'
          className='disabled:cursor-not-allowed'
        >
          {isFullSyncRunning ? (
            <Loader2 className='animate-spin' />
          ) : (
            <RefreshCw />
          )}
          Force Full Sync
        </Button>
      </div>

      {/* Individual Stage Buttons */}
      <div className='flex flex-col gap-2'>
        <div className='text-muted-foreground text-sm font-medium'>
          Individual Stages
        </div>
        <div className='grid grid-cols-2 gap-2 lg:grid-cols-3'>
          {STAGE_CONFIGS.map((stage) => {
            const Icon = stage.icon;
            const isLocalLoading = loadingStages.has(stage.name);
            const isRunningFromAPI = runningStages.includes(stage.apiName);
            const isStageLoading = isLocalLoading || isRunningFromAPI;

            return (
              <Button
                key={stage.name}
                onClick={() => runStage(stage.name, stage.displayName)}
                disabled={isDisabled}
                size='sm'
                variant='outline'
                title={stage.description}
              >
                {isStageLoading ? (
                  <Loader2 className='animate-spin' />
                ) : (
                  <Icon />
                )}
                <span className='truncate'>{stage.displayName}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Market Multiplier Updates */}
      <div className='flex flex-col gap-2'>
        <div className='text-muted-foreground text-sm font-medium'>
          Market Analysis
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={updateMarketMultipliers}
            disabled={isDisabled}
            size='sm'
            variant='outline'
            title='Update market multipliers from recent sales data'
          >
            {multiplierUpdateLoading ? (
              <Loader2 className='animate-spin' />
            ) : (
              <Calculator />
            )}
            Update Market Multipliers
          </Button>
        </div>
        <div className='text-muted-foreground text-xs'>
          Recalculates Age × Position × Overall multipliers from 18 months of
          sales data
        </div>
      </div>

      {/* Status Message */}
      {isRunning && (
        <div className='text-muted-foreground bg-muted rounded border p-2 text-xs'>
          A sync is currently running. Please wait for it to complete before
          starting another.
        </div>
      )}
    </div>
  );
}
