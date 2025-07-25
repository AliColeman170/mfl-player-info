'use client';

import { useMemo, useCallback, useState } from 'react';
import { usePlayersQuery } from '@/hooks/usePlayersQuery';
import { usePlayerFilters } from '../hooks/usePlayerFilters';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import { useTableControls } from '../contexts/TableControlsContext';
import { InfinitePlayersTable } from './table/InfinitePlayersTable';
import { AlertCircle } from 'lucide-react';
import { OnChangeFn, VisibilityState } from '@tanstack/react-table';

interface PlayersTableContainerProps {
  className?: string;
}

export function PlayersTableContainer({
  className,
}: PlayersTableContainerProps) {
  const { apiFilters } = usePlayerFilters();
  const { columnVisibility, setColumnVisibility } = useColumnVisibility();
  const { setTableControls } = useTableControls();

  // This will be passed to the table and then connected to our external controls
  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = useCallback(
    (updater) => {
      const newState =
        typeof updater === 'function' ? updater(columnVisibility) : updater;

      // Update our localStorage state when table changes
      setColumnVisibility(newState);
    },
    [columnVisibility, setColumnVisibility]
  );

  const handleTableReady = useCallback((controls: Parameters<typeof setTableControls>[0]) => {
    console.log('Table controls received:', controls);
    setTableControls(controls);
  }, [setTableControls]);

  // Fetch players using infinite query
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = usePlayersQuery({
    pageSize: 50,
    filters: apiFilters,
  });

  // Flatten all pages into a single array
  const allPlayers = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.players);
  }, [data]);

  // Handle loading more data
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Error state
  if (error) {
    return (
      <div className='flex h-64 flex-col items-center justify-center space-y-4'>
        <AlertCircle className='text-destructive h-12 w-12' />
        <div className='text-center'>
          <h3 className='text-destructive text-lg font-semibold'>
            Failed to load players
          </h3>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <InfinitePlayersTable
      players={allPlayers}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={handleLoadMore}
      className={className}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={handleColumnVisibilityChange}
      onTableReady={handleTableReady}
    />
  );
}
