'use client';

import { useQuery } from '@tanstack/react-query';

interface SyncStageStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun?: string;
  isOneTime: boolean;
  recordsProcessed?: number;
}

interface SyncStatusResponse {
  stages: SyncStageStatus[];
  lastFullSync?: string;
  isRunning: boolean;
  currentExecutionId?: number | null;
  runningStages?: string[];
  timestamp: string;
  error?: string;
}

export function useSyncStatus() {
  return useQuery<SyncStatusResponse>({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const response = await fetch('/api/sync-v2/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: (data) => {
      // Refetch more frequently if a sync is running
      return data?.isRunning ? 2000 : 10000; // 2s if running, 10s if idle
    },
    refetchIntervalInBackground: true,
    staleTime: 1000, // Consider data stale after 1 second
  });
}