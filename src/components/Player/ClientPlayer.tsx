'use client';

import { usePlayerQuery } from '@/hooks/usePlayerQuery';
import { GoalkeeperStats } from './GoalkeeperStats';
import { PositionRatings } from './PositionRatings';
import { PlayerCardSVG } from './PlayerCardSVG';
import { ContractStatsClient } from './ContractStatsClient';
import { Badge } from '../UI/badge';
import Image from 'next/image';
import { PlayerContract } from './PlayerContract';
import {
  CrownIcon,
  InfoIcon,
  Loader2Icon,
  LockIcon,
  ShoppingCartIcon,
} from 'lucide-react';
import {
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from '../UI/tooltip';
import { getTierClasses, getTierFromOverall } from '@/lib/tier-colors';
import { cn } from '@/utils/helpers';
import { MarketValue } from '@/types/global.types';
import { ToggleFavouriteButton } from '../Favourites/ToggleFavouriteButton';
import { Button } from '../UI/button-alt';
import { TagsList } from '../Tags/TagsList';
import { useUser } from '../Wallet/UserProvider';
import { use } from 'react';

interface ClientPlayerProps {
  playerId: number;
}

// Helper functions for consistent descriptions
function getMethodDescription(method: string): string {
  switch (method) {
    case 'ema':
      return 'Based on exponential moving average of recent sales data';
    case 'trimmed-mean':
      return 'Statistical analysis of limited sales data';
    case 'regression':
      return 'Predicted using player characteristics and market patterns';
    case 'position-estimate':
      return 'Fallback estimate based on position and overall rating';
    default:
      return 'Market value estimate';
  }
}

function getConfidenceDescription(confidence: string): string {
  switch (confidence) {
    case 'high':
      return 'High confidence based on recent sales with good sample size';
    case 'medium':
      return 'Medium confidence with some market data available';
    case 'low':
      return 'Low confidence due to limited data, estimate based on player characteristics';
    default:
      return '';
  }
}

function getMarketValueTooltip(marketValue: MarketValue): string {
  try {
    if (marketValue.estimate <= 0) {
      return 'No recent sales data available for market value calculation.';
    }

    return `${getMethodDescription(marketValue.method)} from ${marketValue.basedOn}. ${getConfidenceDescription(marketValue.confidence)}.`;
  } catch (error) {
    return 'Unable to calculate market value at this time.';
  }
}

/**
 * Confidence indicator badge
 */
function ConfidenceBadge({
  confidence,
}: {
  confidence: 'high' | 'medium' | 'low';
}) {
  const styles = {
    high: 'bg-green-50 text-green-700 border-green-700/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20',
    medium:
      'bg-yellow-50 text-yellow-800 border-yellow-800/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:border-yellow-400/20',
    low: 'bg-red-50 text-red-700 border-red-700/20 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20',
  };

  const labels = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  };

  return (
    <Badge
      className={`text-[11px]/3 font-medium ${styles[confidence]}`}
      title={labels[confidence]}
    >
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
    </Badge>
  );
}

export function ClientPlayer({ playerId }: ClientPlayerProps) {
  const { data: player, isLoading, error } = usePlayerQuery(playerId);
  const { userPromise } = useUser();
  const user = use(userPromise);
  const isAuthenticated = !!user?.app_metadata?.address;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2Icon className='size-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center p-8 text-red-500'>
        Error loading player data
      </div>
    );
  }

  if (!player) {
    return (
      <div className='flex items-center justify-center p-8 text-gray-500'>
        Player not found
      </div>
    );
  }

  const isGoalkeeper = player.metadata.positions.includes('GK');
  const tier = getTierFromOverall(player.metadata.overall);
  const tierTextClasses = getTierClasses(tier);

  return (
    <div className='@container/main'>
      <div className='grid grid-cols-1 gap-y-8 @sm/main:grid-cols-3 @sm/main:items-center @sm/main:gap-8'>
        {/* Player Card SVG */}
        <div className='relative'>
          <PlayerCardSVG player={player} />

          {/* Action buttons below card - matching ImageCard layout */}
          <div className='mt-4 flex items-center justify-center gap-x-1.5'>
            <ToggleFavouriteButton
              player={player}
              isFavourite={player.is_favourite || false}
              variant='secondary'
            />
            <Button asChild size='sm' variant='secondary'>
              <Link
                href={{
                  pathname: '/compare',
                  query: {
                    player1: player.id,
                    player2: '',
                  },
                }}
              >
                <ArrowsRightLeftIcon />
              </Link>
            </Button>
            <Button asChild size='sm' variant='secondary'>
              <Link
                href={`https://app.playmfl.com/players/${player.id}`}
                target='_blank'
              >
                <ArrowTopRightOnSquareIcon className='-mr-0.5' />
              </Link>
            </Button>
          </div>
        </div>

        {/* Basic Info - Client Version */}
        <div className='col-span-2 flex flex-col gap-1'>
          <div className='flex items-center gap-2.5'>
            <h1 className='text-2xl font-bold'>
              {player.metadata.firstName} {player.metadata.lastName}
            </h1>
            <Badge
              variant='secondary'
              className={cn('border', tierTextClasses)}
            >
              #{player.id}
            </Badge>
          </div>
          <div className='flex items-center gap-1.5'>
            {player.currentListing?.price && (
              <Link href={`https://app.playmfl.com/players/${player.id}`}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className='border-0 text-[10px] [&>svg]:size-2.5'>
                      <ShoppingCartIcon />
                      For Sale
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Available to buy for ${player.currentListing.price}</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
            )}
            <PlayerContract club={player.club} />
            <Badge
              variant='outline'
              className='flex items-center gap-1 text-[10px] [&>svg]:size-2.5'
            >
              <CrownIcon className='shrink-0' />
              {player.ownedBy?.name
                ? player.ownedBy?.name
                : player.ownedBy?.walletAddress}
            </Badge>
          </div>
          <div className='mt-3 flex flex-col gap-1.5 text-sm'>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Age</div>
              <div>{player.metadata.age}</div>
            </div>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Height</div>{' '}
              <div>{player.metadata.height}cm</div>
            </div>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Position</div>
              <div>{player.metadata.positions[0]}</div>
            </div>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Nation</div>
              <div className='flex items-center gap-1.5'>
                <Image
                  src={`https://app.playmfl.com/img/flags/${player.metadata.nationalities[0]}.svg`}
                  alt={player.metadata.nationalities[0]}
                  width={20}
                  height={20}
                  className='size-4 rounded-sm'
                  unoptimized
                />
                {player.metadata.nationalities[0]
                  .replace('_', ' ')
                  .toLowerCase()
                  .split(' ')
                  .map(
                    (word: string) =>
                      word.charAt(0).toUpperCase() + word.substring(1)
                  )
                  .join(' ')
                  .replace('Of', 'of')}
              </div>
            </div>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Foot</div>
              <div className='capitalize'>
                {player.metadata.preferredFoot.toLowerCase()}
              </div>
            </div>
            {player.marketValue?.estimate ? (
              <div className='flex items-start justify-between'>
                <div className='text-foreground/80 flex items-center gap-1.5 font-medium'>
                  Est. Value
                  <Tooltip>
                    <TooltipTrigger tabIndex={-1}>
                      <InfoIcon className='text-foreground/80 size-4' />
                    </TooltipTrigger>
                    <TooltipContent className='max-w-[280px]'>
                      <p className='text-center'>
                        {getMarketValueTooltip(player.marketValue)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className='flex flex-col items-end'>
                  <div className='flex items-center gap-2'>
                    <ConfidenceBadge
                      confidence={
                        player.marketValue.confidence as
                          | 'high'
                          | 'medium'
                          | 'low'
                      }
                    />
                    <span className='font-medium'>
                      ~${player.marketValue.estimate}
                    </span>
                  </div>
                  <div className='text-muted-foreground mt-0.75 text-xs'>
                    Range: ${player.marketValue.low}-$
                    {player.marketValue.high}
                  </div>
                </div>
              </div>
            ) : (
              <div className='flex items-start justify-between'>
                <div className='text-foreground/80 flex items-center gap-1.5 font-medium'>
                  Est. Value
                  <Tooltip>
                    <TooltipTrigger tabIndex={-1}>
                      <InfoIcon className='text-foreground/80 size-4' />
                    </TooltipTrigger>
                    <TooltipContent className='max-w-[280px]'>
                      <p className='text-center'>
                        Not enough data to calculate market value.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className='flex flex-col items-end'>
                  <span className='text-muted-foreground italic'>
                    Unavailable
                  </span>
                </div>
              </div>
            )}
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Tags</div>
              {isAuthenticated ? (
                <TagsList playerId={player.id} tags={player.tags} />
              ) : (
                <div className='text-foreground talic flex items-center gap-1.5 text-sm'>
                  <LockIcon className='size-3' />
                  <span className='text-muted-foreground italic'>
                    Log in to add tags
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGoalkeeper ? (
        <GoalkeeperStats player={player} />
      ) : (
        <PositionRatings player={player} />
      )}

      <ContractStatsClient player={player} />
    </div>
  );
}
