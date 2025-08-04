'use client';

import { usePlayerQuery } from '@/hooks/usePlayerQuery';
import {
  Loader2Icon,
  CrownIcon,
  ShoppingCartIcon,
  InfoIcon,
  EyeIcon,
  LockIcon,
} from 'lucide-react';
import { Badge } from '@/components/UI/badge';
import { Button } from '@/components/UI/button-alt';
import { getTierFromOverall, getTierClasses } from '@/lib/tier-colors';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlayerCardSVG } from '../Player/PlayerCardSVG';
import { PlayerContract } from '../Player/PlayerContract';
import { ToggleFavouriteButton } from '../Favourites/ToggleFavouriteButton';
import { TagsList } from '../Tags/TagsList';
import { Tooltip, TooltipContent, TooltipTrigger } from '../UI/tooltip';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { MarketValue } from '@/types/global.types';
import { useUser } from '../Wallet/UserProvider';
import { use } from 'react';
import Link from 'next/link';

interface ComparePlayerCardProps {
  playerId: number;
}

// Helper functions for market value (copied from ClientPlayer)
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

export function ComparePlayerCard({ playerId }: ComparePlayerCardProps) {
  const { data: player, isLoading, error } = usePlayerQuery(playerId);
  const { userPromise } = useUser();
  const user = use(userPromise);
  const isAuthenticated = !!user?.app_metadata?.address;

  if (isLoading) {
    return (
      <div className='flex h-32 items-center justify-center'>
        <Loader2Icon className='size-6 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-32 items-center justify-center text-red-500'>
        <div className='text-center'>
          <div className='mb-1 text-sm font-medium'>Error loading player</div>
          <div className='text-xs'>Please try selecting another player</div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className='flex h-32 items-center justify-center text-gray-500'>
        <div className='text-center'>
          <div className='mb-1 text-sm font-medium'>Player not found</div>
          <div className='text-xs'>Please try selecting another player</div>
        </div>
      </div>
    );
  }

  const tier = getTierFromOverall(player.metadata.overall);
  const tierTextClasses = getTierClasses(tier);

  return (
    <div className='@container/main'>
      <div className='grid grid-cols-1 gap-y-6 @sm/main:grid-cols-3 @sm/main:items-start @sm/main:gap-6'>
        {/* Player Card SVG */}
        <div className='relative'>
          <PlayerCardSVG player={player} />

          {/* Action buttons below card */}
          <div className='mt-4 flex items-center justify-center gap-x-1.5'>
            <ToggleFavouriteButton
              player={player}
              isFavourite={player.is_favourite || false}
              variant='secondary'
            />
            <Button asChild size='sm' variant='secondary'>
              <Link href={`/player/${player.id}`}>
                <EyeIcon />
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

        {/* Basic Info - Similar to player page but more compact */}
        <div className='col-span-2 flex flex-col gap-1'>
          <div className='flex items-center gap-2.5'>
            <h1 className='text-xl font-bold'>
              {player.metadata.firstName} {player.metadata.lastName}
            </h1>
            <Badge
              variant='secondary'
              className={cn('border text-xs', tierTextClasses)}
            >
              #{player.id}
            </Badge>
          </div>

          {/* Status Badges */}
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
            {player.club && <PlayerContract club={player.club} />}
            <Badge
              variant='outline'
              className='flex items-center gap-1 text-[10px] [&>svg]:size-2.5'
            >
              <CrownIcon className='shrink-0' />
              {player.ownedBy?.name || player.ownedBy?.walletAddress}
            </Badge>
          </div>

          {/* Player Details */}
          <div className='mt-3 flex flex-col gap-1.5 text-sm'>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Age</div>
              <div>{player.metadata.age}</div>
            </div>
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Height</div>
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
                <div className='text-muted-foreground font-medium'>N/A</div>
              </div>
            )}
            <div className='flex justify-between'>
              <div className='text-foreground/80 font-medium'>Tags</div>
              {isAuthenticated ? (
                <TagsList playerId={player.id} tags={player.tags} />
              ) : (
                <div className='text-foreground flex items-center gap-1.5 text-sm'>
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
    </div>
  );
}
