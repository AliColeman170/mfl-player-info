'use client';

import { useMemo, useCallback } from 'react';
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
    
    const flattened = data.pages.flatMap((page) => page.players);
    
    // Debug: Check for duplicates to verify stable sorting fix
    const ids = flattened.map(p => p.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error('DUPLICATE PLAYERS DETECTED (stable sorting failed):', {
        totalPlayers: ids.length,
        uniquePlayers: uniqueIds.size,
        duplicateCount: ids.length - uniqueIds.size,
        currentSort: `${apiFilters.sortBy || 'default'} ${apiFilters.sortOrder || 'desc'}`,
        pages: data.pages.map((page, index) => ({
          pageIndex: index,
          playerCount: page.players.length,
          firstId: page.players[0]?.id,
          lastId: page.players[page.players.length - 1]?.id,
          nextCursor: page.nextCursor,
          // Show boundary data to debug overlaps
          lastFewIds: page.players.slice(-3).map(p => p.id),
          firstFewIds: page.players.slice(0, 3).map(p => p.id)
        }))
      });
      
      // Find the duplicate IDs
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.error('Duplicate player IDs:', [...new Set(duplicateIds)]);
    } else {
      console.log('✅ No duplicates detected - stable sorting working!');
    }
    
    return flattened;
  }, [data, apiFilters.sortBy, apiFilters.sortOrder]);

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
