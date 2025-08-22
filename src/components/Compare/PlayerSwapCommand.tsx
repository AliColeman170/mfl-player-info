import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/UI/command';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import { Loader2Icon, CrownIcon, ShoppingBasketIcon } from 'lucide-react';
import { ArrowsRightLeftIcon } from '@heroicons/react/20/solid';
import { cn } from '@/lib/utils';
import { getTierClasses, getTierFromOverall } from '@/lib/tier-colors';
import { StyledRatingValue } from '../Player/StyledRatingValue';
import { PlayerContract } from '../Player/PlayerContract';
import Image from 'next/image';
import { SearchPlayerResult } from '@/types/global.types';

// Using centralized SearchPlayerResult type from global.types.ts
type SearchPlayer = SearchPlayerResult;

async function searchPlayers({
  query,
  pageParam = 0,
}: {
  query: string;
  pageParam?: number;
}): Promise<{
  players: SearchPlayer[];
  hasNextPage: boolean;
  nextCursor?: number;
}> {
  if (!query.trim()) {
    return { players: [], hasNextPage: false };
  }

  const supabase = createClient();
  const limit = 15;
  const offset = pageParam;

  const searchTerm = query.trim().toLowerCase();

  const { data: players, error } = await supabase
    .from('players')
    .select(
      `
      id,
      first_name,
      last_name,
      overall,
      primary_position,
      secondary_positions,
      nationality,
      age,
      club_id,
      club_name,
      club_type,
      owner_wallet_address,
      owner_name,
      current_listing_price
    `
    )
    .ilike('search_text', `%${searchTerm}%`)
    .order('overall', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Search error:', error);
    return { players: [], hasNextPage: false };
  }

  return {
    players: players || [],
    hasNextPage: players?.length === limit,
    nextCursor: players?.length === limit ? offset + limit : undefined,
  };
}

function PlayerItem({
  player,
  onSelect,
}: {
  player: SearchPlayer;
  onSelect: (playerId: number) => void;
}) {
  const tier = getTierFromOverall(player.overall || 0);
  const tierClasses = getTierClasses(tier);

  const handleSelect = useCallback(() => {
    onSelect(player.id);
  }, [player.id, onSelect]);

  return (
    <CommandItem
      value={`${player.first_name || ''} ${player.last_name || ''} ${player.id}`}
      onSelect={handleSelect}
      className='flex cursor-pointer items-center gap-3 px-3 py-2'
    >
      {/* Player Card Image */}
      <Image
        src={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${player.id}/card.png`}
        alt={`${player.first_name || ''} ${player.last_name || ''} card`}
        width={500}
        height={835}
        className='w-8 shrink-0'
        unoptimized
      />

      {/* Player Info */}
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <div className='flex items-center gap-1.5'>
          <span className='truncate text-sm font-medium'>
            {player.first_name || ''} {player.last_name || ''}
          </span>
          <Badge variant='secondary' className={cn('text-[10px]', tierClasses)}>
            #{player.id}
          </Badge>
        </div>
        <div className='flex items-center gap-1'>
          {player.current_listing_price && (
            <Badge className='rounded-sm border-0 text-[9px] [&>svg]:size-1.5'>
              <ShoppingBasketIcon />
              For Sale
            </Badge>
          )}
          {player.club_id && (
            <PlayerContract
              club={{
                id: player.club_id,
                name: player.club_name!,
                type: player.club_type!,
              }}
              className='text-[9px] [&>svg]:size-1.5'
            />
          )}
          <Badge
            variant='outline'
            className='bg-background flex items-center gap-0.5 text-[9px] [&>svg]:size-1.5'
          >
            <CrownIcon className='shrink-0' />
            {player.owner_name || player.owner_wallet_address}
          </Badge>
        </div>
      </div>

      {/* Position and Rating */}
      <div className='flex flex-shrink-0 items-center gap-2'>
        <div className='text-xs font-medium'>{player.primary_position}</div>
        <StyledRatingValue rating={player.overall || 0} size='sm' />
      </div>
    </CommandItem>
  );
}

// Custom hook for debounced search
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function PlayerSwapCommand({
  currentPlayerId,
  playerLabel,
  onPlayerSelect,
}: {
  currentPlayerId?: number;
  playerLabel: string;
  onPlayerSelect: (playerId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['player-swap-search', debouncedSearch],
      queryFn: ({ pageParam = 0 }) =>
        searchPlayers({ query: debouncedSearch, pageParam }),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: 0,
      enabled: debouncedSearch.length > 0,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

  const players = data?.pages.flatMap((page) => page.players) || [];

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const handlePlayerSelect = useCallback(
    (playerId: number) => {
      onPlayerSelect(playerId);
      setOpen(false);
    },
    [onPlayerSelect]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle scroll-based infinite loading
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      if (!target) return;

      const { scrollTop, scrollHeight, clientHeight } = target;
      const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.5;

      if (isNearBottom && hasNextPage && !isFetchingNextPage) {
        handleLoadMore();
      }
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [hasNextPage, isFetchingNextPage, handleLoadMore]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant='outline'
        size='sm'
        onClick={() => setOpen(true)}
        className='border-background bg-muted hover:bg-muted/80 absolute -top-2 right-2 z-10 h-8 w-8 rounded-full border-2 p-0 shadow-sm'
        title={`Replace ${playerLabel}`}
      >
        <ArrowsRightLeftIcon className='h-3 w-3' />
      </Button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className='[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5'>
          <CommandInput
            placeholder={`Search to replace ${playerLabel}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList ref={listRef}>
            {(isLoading || search !== debouncedSearch) && debouncedSearch && (
              <div className='flex items-center justify-center py-6'>
                <Loader2Icon className='size-4 animate-spin' />
              </div>
            )}

            {!isLoading &&
              debouncedSearch &&
              players.length === 0 &&
              search === debouncedSearch && (
                <CommandEmpty>
                  No players found for &quot;{debouncedSearch}&quot;
                </CommandEmpty>
              )}

            {players.length > 0 && (
              <CommandGroup>
                {players
                  .filter((player) => player.id !== currentPlayerId)
                  .map((player) => (
                    <PlayerItem
                      key={player.id}
                      player={player}
                      onSelect={handlePlayerSelect}
                    />
                  ))}

                {hasNextPage && (
                  <div className='px-4 py-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2Icon className='mr-2 size-4 animate-spin' />
                          Loading more...
                        </>
                      ) : (
                        'Load more players'
                      )}
                    </Button>
                  </div>
                )}
              </CommandGroup>
            )}

            {!search && (
              <div className='px-4 py-6 text-center'>
                <div className='text-muted-foreground mb-2 text-sm'>
                  Start typing to search for players to compare with
                </div>
                <div className='text-muted-foreground/70 text-xs'>
                  Search by player name or ID to replace {playerLabel}
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
