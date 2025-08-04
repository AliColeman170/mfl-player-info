import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/20/solid';
import { cn } from '@/utils/helpers';
import { getTierFromOverall, getTierClasses } from '@/lib/tier-colors';
import { ToggleFavouriteButton } from '@/components/Favourites/ToggleFavouriteButton';
import { TagsList } from '@/components/Tags/TagsList';
import { PlayerWithFavouriteData } from '../../types';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button';
import {
  ArrowUpRightFromSquareIcon,
  Loader2Icon,
  LockIcon,
  MoreVerticalIcon,
  RefreshCwIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/UI/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUser } from '@/components/Wallet/UserProvider';
import { use } from 'react';

const columnHelper = createColumnHelper<PlayerWithFavouriteData>();

// Component for tags cell with authentication check
const TagsCell = React.memo(function TagsCell({
  player,
}: {
  player: PlayerWithFavouriteData;
}) {
  const { userPromise } = useUser();
  const user = use(userPromise);
  const isAuthenticated = !!user?.app_metadata?.address;

  if (!isAuthenticated) {
    return (
      <div className='text-muted-foreground flex items-center justify-center gap-1.5 text-xs italic'>
        <LockIcon className='size-3' />
        Please log in to add tags
      </div>
    );
  }

  return <TagsList playerId={player.id} tags={player.tags} />;
});

// Component for actions cell with React Query integration
const PlayerActionsCell = React.memo(function PlayerActionsCell({
  player,
}: {
  player: PlayerWithFavouriteData;
}) {
  const queryClient = useQueryClient();

  const refreshPlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const response = await fetch(`/api/sync/player/${playerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh player');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to refresh player');
      }

      return result;
    },
    onSuccess: (data, playerId) => {
      // Show success toast
      toast.success(`Player ${playerId} refreshed successfully`);

      // Invalidate both API and database infinite queries
      queryClient.invalidateQueries({
        queryKey: ['players-infinite'],
        type: 'active',
      });

      queryClient.invalidateQueries({
        queryKey: ['players-db-infinite'],
        type: 'active',
      });

      // Also invalidate any individual player queries
      queryClient.invalidateQueries({
        queryKey: ['player', playerId],
        type: 'active',
      });
    },
    onError: (error: Error, playerId) => {
      console.error('Error refreshing player:', error);
      toast.error(`Failed to refresh player ${playerId}: ${error.message}`);
    },
  });

  const handleRefreshPlayer = () => {
    refreshPlayerMutation.mutate(player.id);
  };

  return (
    <div className='flex items-center justify-center'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='size-8 p-0'
            disabled={refreshPlayerMutation.isPending}
          >
            {refreshPlayerMutation.isPending ? (
              <Loader2Icon className='animate-spin' />
            ) : (
              <MoreVerticalIcon />
            )}
            <span className='sr-only'>Open actions menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            onClick={handleRefreshPlayer}
            disabled={refreshPlayerMutation.isPending}
            className='cursor-pointer text-sm'
          >
            <RefreshCwIcon
              className={cn(refreshPlayerMutation.isPending && 'animate-spin')}
            />
            {refreshPlayerMutation.isPending
              ? 'Refreshing...'
              : 'Refresh Player'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});

// Rating component for consistent styling
const RatingCell = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  const tier = getTierFromOverall(value);
  const tierTailwindClasses = getTierClasses(tier);
  return (
    <div
      className={cn(
        'flex size-8 items-center justify-center rounded-md border p-1 text-center text-sm font-medium',
        tierTailwindClasses,
        className
      )}
    >
      {value}
    </div>
  );
};

// Position badge component
const PositionBadge = ({ position }: { position: string }) => (
  <Badge variant='outline' className='text-[11px]'>
    {position}
  </Badge>
);

// Simplified column definitions that work with the actual data structure
export const columns = [
  // Favourite toggle - always visible
  columnHelper.accessor((row) => !!row.is_favourite, {
    id: 'favourite',
    header: () => (
      <div className='flex w-8 items-center justify-center'>
        <HeartIconOutline className='text-muted-foreground size-4' />
      </div>
    ),
    cell: ({ row }) => (
      <div className='flex items-center justify-center'>
        <ToggleFavouriteButton
          player={row.original}
          isFavourite={row.original.is_favourite ?? false}
          className='flex size-7 items-center justify-center rounded-full'
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  }),

  // Player ID with link
  columnHelper.accessor((row) => +row.id, {
    id: 'id',
    header: 'ID',
    cell: ({ row, getValue }) => (
      <Link
        href={`/player/${row.original.id}`}
        className='text-primary font-medium hover:underline'
      >
        #{getValue()}
      </Link>
    ),
    enableSorting: true,
    size: 80,
  }),

  // Nationality with flag
  columnHelper.accessor((row) => row.metadata.nationalities[0], {
    id: 'nationality',
    header: 'Nation',
    cell: ({ getValue }) => {
      const nationality = getValue();
      if (!nationality) return null;
      return (
        <div className='flex items-center justify-center'>
          <Image
            src={`https://app.playmfl.com/img/flags/${nationality}.svg`}
            alt={nationality}
            width={20}
            height={20}
            className='size-6 rounded-md'
            unoptimized
          />
        </div>
      );
    },
    enableSorting: true,
    size: 60,
  }),

  // Player name with link and external icon
  columnHelper.accessor(
    (row) => `${row.metadata.firstName} ${row.metadata.lastName}`,
    {
      id: 'name',
      header: 'Name',
      cell: ({ row, getValue }) => (
        <div className='flex min-w-0 items-center gap-1'>
          <Link
            href={`/player/${row.original.id}`}
            className='truncate font-medium hover:underline'
          >
            {getValue()}
          </Link>
          <Button
            variant='ghost'
            size='icon'
            className='size-6 p-0 opacity-60 hover:opacity-100'
            asChild
          >
            <Link
              href={`https://app.playmfl.com/player/${row.original.id}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <ArrowUpRightFromSquareIcon className='size-3' />
            </Link>
          </Button>
        </div>
      ),
      enableSorting: true,
      size: 200,
    }
  ),

  // Owner Name
  columnHelper.accessor((row) => row.ownedBy?.name, {
    id: 'ownerName',
    header: 'Owner',
    cell: ({ getValue }) => {
      const ownerName = getValue();
      if (!ownerName) {
        return <div className='text-muted-foreground text-center'>-</div>;
      }
      return (
        <div className='flex items-center justify-center'>
          <Badge variant='outline' className='max-w-[100px] text-[10px]'>
            <span className='truncate text-ellipsis' title={ownerName}>
              {ownerName}
            </span>
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    size: 120,
  }),

  // Club
  columnHelper.accessor((row) => row.club?.name ?? '', {
    id: 'club',
    header: 'Club',
    cell: ({ getValue, row }) => {
      const clubName = getValue();
      const club = row.original.club;

      // Free Agent
      if (!clubName) {
        return (
          <div className='flex items-center justify-center'>
            <Badge variant='secondary' className='text-[10px]'>
              Free Agent
            </Badge>
          </div>
        );
      }

      // Development Center
      if (club?.type === 'DEVELOPMENT_CENTER') {
        return (
          <div className='flex items-center justify-center'>
            <Badge className='gap-1 bg-yellow-300 text-[10px] text-black hover:bg-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-400'>
              <ArrowTrendingUpIcon className='size-3.5 shrink-0' />
              <span className='truncate text-ellipsis'>Development Center</span>
            </Badge>
          </div>
        );
      }

      // Regular Club
      return (
        <div className='flex items-center justify-center'>
          <Badge variant='outline' className='gap-1.5 text-[10px]'>
            <Image
              src={`https://d13e14gtps4iwl.cloudfront.net/u/clubs/${club?.id}/logo.png?v=1`}
              className='size-3.5'
              alt={clubName}
              width={100}
              height={100}
              unoptimized
            />
            <span
              className='max-w-[80px] truncate text-ellipsis'
              title={clubName}
            >
              {clubName}
            </span>
          </Badge>
        </div>
      );
    },
    enableSorting: true,
    size: 120,
  }),

  // Age - direct from metadata
  columnHelper.accessor((row) => row.metadata.age, {
    id: 'age',
    header: 'Age',
    cell: ({ getValue }) => (
      <div className='text-center font-medium'>{getValue()}</div>
    ),
    enableSorting: true,
    size: 60,
  }),

  // Height
  columnHelper.accessor((row) => row.metadata.height, {
    id: 'height',
    header: 'Height',
    cell: ({ getValue }) => (
      <div className='text-center font-medium'>{getValue()}cm</div>
    ),
    enableSorting: true,
    size: 70,
  }),

  // Preferred Foot
  columnHelper.accessor((row) => row.metadata.preferredFoot, {
    id: 'preferredFoot',
    header: 'Foot',
    cell: ({ getValue }) => (
      <div className='text-center text-xs'>
        <Badge variant='outline' className='text-[10px]'>
          {getValue() === 'RIGHT' ? 'R' : getValue() === 'LEFT' ? 'L' : 'B'}
        </Badge>
      </div>
    ),
    enableSorting: true,
    size: 60,
  }),

  // Overall rating with rarity styling
  columnHelper.accessor((row) => row.metadata.overall, {
    id: 'overall',
    header: 'OVR',
    cell: ({ getValue }) => {
      const rating = getValue();
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-bold' />
        </div>
      );
    },
    enableSorting: true,
    size: 40,
  }),

  // Primary position
  columnHelper.accessor((row) => row.metadata.positions[0], {
    id: 'position',
    header: 'Position',
    cell: ({ getValue }) => (
      <div className='text-center'>
        <PositionBadge position={getValue()} />
      </div>
    ),
    enableSorting: true,
    size: 80,
  }),

  // Secondary positions
  columnHelper.accessor((row) => row.metadata.positions.slice(1).join(', '), {
    id: 'positions',
    header: 'Secondary',
    cell: ({ getValue }) => {
      const positions = getValue();
      return positions ? (
        <div className='text-muted-foreground text-center text-xs'>
          {positions}
        </div>
      ) : null;
    },
    enableSorting: false,
    size: 80,
  }),

  // Individual ratings
  columnHelper.accessor((row) => row.metadata.pace, {
    id: 'pace',
    header: 'PAC',
    cell: ({ getValue, row }) => {
      const rating = getValue();
      // Hide for goalkeepers since they're always 0
      if (row.original.metadata.positions[0] === 'GK') return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-medium' />
        </div>
      );
    },
    enableSorting: true,
    size: 36,
  }),

  columnHelper.accessor((row) => row.metadata.shooting, {
    id: 'shooting',
    header: 'SHO',
    cell: ({ getValue, row }) => {
      const rating = getValue();
      // Hide for goalkeepers since they're always 0
      if (row.original.metadata.positions[0] === 'GK') return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-medium' />
        </div>
      );
    },
    enableSorting: true,
    size: 36,
  }),

  columnHelper.accessor((row) => row.metadata.passing, {
    id: 'passing',
    header: 'PAS',
    cell: ({ getValue, row }) => {
      const rating = getValue();
      // Hide for goalkeepers since they're always 0
      if (row.original.metadata.positions[0] === 'GK') return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-medium' />
        </div>
      );
    },
    enableSorting: true,
    size: 36,
  }),

  columnHelper.accessor((row) => row.metadata.dribbling, {
    id: 'dribbling',
    header: 'DRI',
    cell: ({ getValue, row }) => {
      const rating = getValue();
      // Hide for goalkeepers since they're always 0
      if (row.original.metadata.positions[0] === 'GK') return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-medium' />
        </div>
      );
    },
    enableSorting: true,
    size: 36,
  }),

  columnHelper.accessor((row) => row.metadata.defense, {
    id: 'defense',
    header: 'DEF',
    cell: ({ getValue, row }) => {
      const rating = getValue();
      // Hide for goalkeepers since they're always 0
      if (row.original.metadata.positions[0] === 'GK') return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-medium' />
        </div>
      );
    },
    enableSorting: true,
    size: 36,
  }),

  columnHelper.accessor((row) => row.metadata.physical, {
    id: 'physical',
    header: 'PHY',
    cell: ({ getValue, row }) => {
      const rating = getValue();
      // Hide for goalkeepers since they're always 0
      if (row.original.metadata.positions[0] === 'GK') return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-medium' />
        </div>
      );
    },
    enableSorting: true,
    size: 36,
  }),

  // Best Position - from database
  columnHelper.accessor((row) => row.bestPosition, {
    id: 'bestPosition',
    header: 'Best Pos',
    cell: ({ getValue }) => {
      const position = getValue();
      if (!position) return null;
      return (
        <div className='text-center'>
          <PositionBadge position={position} />
        </div>
      );
    },
    enableSorting: true,
    size: 80,
  }),

  // Best Rating - from database
  columnHelper.accessor((row) => row.bestOvr ?? row.metadata.overall, {
    id: 'bestRating',
    header: 'Best Overall',
    cell: ({ getValue }) => {
      const rating = getValue();
      if (!rating) return null;
      return (
        <div className='flex items-center justify-center'>
          <RatingCell value={rating} className='font-bold' />
        </div>
      );
    },
    enableSorting: true,
    size: 50,
  }),

  // Difference - from database
  columnHelper.accessor((row) => row.ovrDifference ?? 0, {
    id: 'difference',
    header: 'Best Diff',
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === 0) return null;
      return (
        <div className='flex items-center justify-center space-x-1'>
          <span
            className={cn('text-xs font-medium', {
              'text-green-600': value > 0,
              'text-red-600': value < 0,
            })}
          >
            {value > 0 ? `+${value}` : value}
          </span>
        </div>
      );
    },
    enableSorting: true,
    size: 60,
  }),

  // Market Value
  columnHelper.accessor((row) => row.marketValue?.estimate, {
    id: 'marketValue',
    header: 'Market Value',
    cell: ({ getValue, row }) => {
      const value = getValue();
      const confidence = row.original.marketValue?.confidence;

      if (value === null || value === undefined)
        return <div className='text-muted-foreground text-center'>-</div>;

      // Map confidence to badge color and text
      const getConfidenceBadge = (conf: string) => {
        switch (conf) {
          case 'high':
            return (
              <Badge
                variant='default'
                className='ml-1 h-4 bg-green-500 px-1 py-0 text-[9px] text-white'
              >
                H
              </Badge>
            );
          case 'medium':
            return (
              <Badge
                variant='default'
                className='ml-1 h-4 bg-yellow-500 px-1 py-0 text-[9px] text-white'
              >
                M
              </Badge>
            );
          case 'low':
            return (
              <Badge
                variant='default'
                className='ml-1 h-4 bg-red-500 px-1 py-0 text-[9px] text-white'
              >
                L
              </Badge>
            );
          default:
            return null;
        }
      };

      return (
        <div className='flex items-center justify-center gap-1 font-medium'>
          <span>${value.toLocaleString()}</span>
          {confidence && getConfidenceBadge(confidence)}
        </div>
      );
    },
    enableSorting: true,
    size: 130,
  }),

  // Current Listing Price
  columnHelper.accessor((row) => row.currentListing?.price, {
    id: 'listingPrice',
    header: 'Sale Price',
    cell: ({ getValue }) => {
      const value = getValue();

      if (value === null || value === undefined)
        return <div className='text-muted-foreground text-center'>-</div>;

      return (
        <div className={cn('text-center font-medium')}>
          ${value.toLocaleString()}
        </div>
      );
    },
    enableSorting: true,
    size: 100,
  }),

  // Price Difference (Listing - Market Value) - from database
  columnHelper.accessor((row) => row.priceDifference, {
    id: 'priceDifference',
    header: 'Price Diff',
    cell: ({ getValue, row }) => {
      const value = getValue();
      if (value === null || value === undefined)
        return <div className='text-muted-foreground text-center'>-</div>;

      const marketValue = row.original.marketValue?.estimate;
      if (marketValue === null || marketValue === undefined)
        return <div className='text-muted-foreground text-center'>-</div>;

      const percentage = (value / marketValue) * 100;
      const isPositive = value > 0;

      return (
        <div className='flex flex-col items-center justify-center text-xs'>
          <span
            className={cn('font-medium', {
              'text-red-600': isPositive,
              'text-green-600': !isPositive,
            })}
          >
            {isPositive ? '+' : ''}${value.toLocaleString()}
          </span>
          <span
            className={cn('text-[10px]', {
              'text-red-600': isPositive,
              'text-green-600': !isPositive,
            })}
          >
            {isPositive ? '+' : ''}
            {percentage.toFixed(1)}%
          </span>
        </div>
      );
    },
    enableSorting: true,
    size: 80,
  }),

  // Tags
  columnHelper.accessor((row) => row.tags, {
    id: 'tags',
    header: 'Tags',
    cell: ({ row }) => <TagsCell player={row.original} />,
    enableSorting: false,
    size: 150,
  }),

  // Last Synced
  columnHelper.accessor((row) => row.lastSyncedAt, {
    id: 'lastSynced',
    header: 'Last Synced',
    cell: ({ getValue }) => {
      const lastSynced = getValue();
      if (!lastSynced)
        return <span className='text-muted-foreground text-xs'>Never</span>;

      const date = new Date(lastSynced);

      return (
        <span className='text-muted-foreground text-xs'>
          {date.toLocaleString()}
        </span>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 160,
  }),

  // Actions column - sticky at the end
  columnHelper.display({
    id: 'actions',
    cell: ({ row }) => <PlayerActionsCell player={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  }),
];

// Column configuration for easy management
export const columnConfig = {
  defaultVisible: [
    'favourite',
    'id',
    'nationality',
    'name',
    'ownerName',
    'club',
    'age',
    'position',
    'overall',
    'bestPosition',
    'bestRating',
    'marketValue',
    'listingPrice',
    'lastSynced',
    'actions',
  ],
  alwaysVisible: ['favourite', 'name', 'lastSynced', 'actions'],
  hiddenByDefault: [
    'height',
    'preferredFoot',
    'positions',
    'pace',
    'shooting',
    'passing',
    'dribbling',
    'defense',
    'physical',
    'difference',
    'priceDifference',
    'tags',
  ],
  ratings: [
    'overall',
    'pace',
    'shooting',
    'passing',
    'dribbling',
    'defense',
    'physical',
    'bestRating',
  ],
};

// Column labels for filters and UI
export const columnLabels = columns.reduce(
  (acc, col) => {
    if ('id' in col && typeof col.id === 'string' && 'header' in col) {
      acc[col.id] =
        typeof col.header === 'string'
          ? col.header
          : col.id
              .toLowerCase()
              .split(' ')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
    }
    return acc;
  },
  {} as Record<string, string>
);
