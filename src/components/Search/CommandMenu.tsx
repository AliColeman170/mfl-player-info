'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/UI/command';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import {
  SearchIcon,
  Loader2Icon,
  CrownIcon,
  ShoppingBasketIcon,
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { getTierClasses, getTierFromOverall } from '@/lib/tier-colors';
import { StyledRatingValue } from '../Player/StyledRatingValue';
import { PlayerContract } from '../Player/PlayerContract';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../UI/dialog';
import Link from 'next/link';
import Image from 'next/image';

interface SearchPlayer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  overall: number | null;
  primary_position: string | null;
  secondary_positions: string[] | null;
  nationality: string | null;
  club_id: number | null;
  club_name?: string | null;
  club_type: string | null;
  owner_wallet_address: string | null;
  owner_name?: string | null;
  age: number | null;
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defense: number | null;
  physical: number | null;
  current_listing_price: number | null;
}

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
  const limit = 20;
  const offset = pageParam;

  // Use the computed search_text column for unified search
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
      pace,
      shooting,
      passing,
      dribbling,
      defense,
      physical,
      club_id,
      club_name,
      club_type,
      owner_wallet_address,
      owner_name,
      current_listing_price
    `
    )
    .ilike('search_text', `%${searchTerm}%`)
    .order('id', { ascending: true })
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

// Transform SearchPlayer to PlayerCardSVG format
function transformPlayerForCard(player: SearchPlayer) {
  return {
    id: player.id,
    metadata: {
      firstName: player.first_name || '',
      lastName: player.last_name || '',
      age: player.age || 0,
      overall: player.overall || 0,
      pace: player.pace || 0,
      shooting: player.shooting || 0,
      passing: player.passing || 0,
      dribbling: player.dribbling || 0,
      defense: player.defense || 0,
      physical: player.physical || 0,
      positions: [
        player.primary_position,
        ...(player.secondary_positions || []),
      ].filter((pos): pos is string => Boolean(pos)),
      nationalities: player.nationality ? [player.nationality] : [],
    },
  };
}

function PlayerItem({
  player,
  onSelect,
}: {
  player: SearchPlayer;
  onSelect: () => void;
}) {
  const router = useRouter();
  const tier = getTierFromOverall(player.overall || 0);
  const tierClasses = getTierClasses(tier);

  const handleSelect = useCallback(() => {
    router.push(`/player/${player.id}`);
    onSelect(); // Close the dialog
  }, [player.id, router, onSelect]);

  return (
    <CommandItem
      value={`${player.first_name || ''} ${player.last_name || ''} ${player.id}`}
      onSelect={handleSelect}
      className='flex cursor-pointer items-center gap-4 px-4! py-2!'
    >
      {/* Player Card SVG */}
      <Image
        src={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${player.id}/card.png`}
        alt={player.first_name || '' + ' ' + player.last_name || ''}
        width={500}
        height={835}
        className='w-10 shrink-0'
        unoptimized
      />

      {/* Player Info */}
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <span className='truncate text-base font-semibold'>
            {player.first_name || ''} {player.last_name || ''}
          </span>
          <Badge variant='secondary' className={cn('border', tierClasses)}>
            #{player.id}
          </Badge>
        </div>
        <div className='flex items-center gap-1'>
          {player.current_listing_price && (
            <Badge className='[&>svg]:text-primary-foreground! rounded-sm border-0 text-[10px] [&>svg]:size-2.5!'>
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
            />
          )}
          <Badge
            variant='outline'
            className='bg-background flex items-center gap-1 text-[10px] [&>svg]:size-2.5!'
          >
            <CrownIcon className='shrink-0' />
            {player.owner_name
              ? player.owner_name
              : player.owner_wallet_address}
          </Badge>
        </div>
      </div>

      {/* Overall Rating */}
      <div className='flex flex-shrink-0 items-center gap-3'>
        <div className='font-bold'>{player.primary_position}</div>
        <StyledRatingValue rating={player.overall || 0} />
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

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300); // 300ms debounce
  const listRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['player-search', debouncedSearch],
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

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          onClick={() => setOpen(true)}
          className='w-full'
        >
          <SearchIcon />
          <span>Go to player...</span>
          <CommandShortcut>⌘K</CommandShortcut>
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className='gap-0 p-0'>
        <DialogHeader className='sr-only'>
          <DialogTitle>Search players...</DialogTitle>
          <DialogDescription>
            Search for players to view detailed information...
          </DialogDescription>
        </DialogHeader>
        <Command className='[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5'>
          <CommandInput
            placeholder='Search players by name or ID...'
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
              <>
                <CommandGroup>
                  {players.map((player) => (
                    <PlayerItem
                      key={player.id}
                      player={player}
                      onSelect={() => setOpen(false)}
                    />
                  ))}

                  {hasNextPage && (
                    <CommandItem onClick={handleLoadMore}>
                      {isFetchingNextPage ? (
                        <>
                          <Loader2Icon className='mr-2 size-4 animate-spin' />
                          Loading more...
                        </>
                      ) : (
                        'Load more players'
                      )}
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}

            {!search && (
              <div className='px-4 py-6 text-center'>
                <div className='text-muted-foreground mb-2 text-sm'>
                  Start typing to search for players by name or ID
                </div>
                <div className='text-muted-foreground/70 text-xs'>
                  Use{' '}
                  <kbd className='bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]'>
                    ⌘K
                  </kbd>{' '}
                  or{' '}
                  <kbd className='bg-muted rounded px-1.5 py-0.5 font-mono text-[10px]'>
                    /
                  </kbd>{' '}
                  to open search
                </div>
              </div>
            )}
          </CommandList>
        </Command>
        <div className='border-border bg-popover flex items-center justify-center rounded-b-lg border-t p-1'>
          <Button
            asChild
            variant='ghost'
            size='sm'
            className='hover:bg-accent w-full'
          >
            <Link href='/players-table' onNavigate={() => setOpen(false)}>
              View all players
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
