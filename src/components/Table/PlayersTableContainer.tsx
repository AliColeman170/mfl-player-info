'use client';

import { useMemo, useState } from 'react';
import { VirtualizedTable } from './VirtualizedTable';
import { usePlayersQuery } from '@/hooks/usePlayersQuery';
import { PlayerWithFavouriteData } from '@/types/global.types';

interface PlayersTableContainerProps {
  initialPlayers?: PlayerWithFavouriteData[];
  enableInfiniteScroll?: boolean;
}

export function PlayersTableContainer({
  initialPlayers = [],
  enableInfiniteScroll = true,
}: PlayersTableContainerProps) {
  const filters = {
    search: '',
    position: [] as string[],
    ageRange: [16, 40] as [number, number],
    overallRange: [40, 99] as [number, number],
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = usePlayersQuery({
    pageSize: 50,
    filters,
  });

  const allPlayers = useMemo(() => {
    if (data) {
      return data.pages.flatMap((page) => page.players);
    }
    return initialPlayers;
  }, [data, initialPlayers]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage && enableInfiniteScroll) {
      fetchNextPage();
    }
  };

  if (error) {
    return (
      <div className='flex h-full w-full items-center justify-center'>
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
    <VirtualizedTable
      players={allPlayers}
      onLoadMore={enableInfiniteScroll ? handleLoadMore : undefined}
      hasNextPage={hasNextPage}
      isLoading={isLoading || isFetchingNextPage}
    />
  );
}
