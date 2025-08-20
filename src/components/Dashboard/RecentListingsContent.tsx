'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { useRecentListings } from '@/hooks/useRecentListings';
import { Clock, CrownIcon, ShoppingBasketIcon } from 'lucide-react';
import { getTierFromOverall, getTierClasses } from '@/lib/tier-colors';
import { cn } from '@/lib/utils';
import { StyledRatingValue } from '../Player/StyledRatingValue';

function RecentListingsSkeleton() {
  return (
    <div className='flex flex-col gap-3'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='bg-muted/50 flex items-center gap-4 rounded-lg px-3 py-2'
        >
          <Skeleton className='h-[67px] w-10 shrink-0' />
          <div className='flex flex-1 flex-col gap-2'>
            <div className='flex gap-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-12' />
            </div>
            <div className='flex items-center gap-1'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-4 w-12' />
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-12'>
            <Skeleton className='size-8' />
            <div className='flex flex-col items-end gap-1 text-right'>
              <Skeleton className='h-5 w-16' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentListingsContent() {
  const { data: listings, isLoading, error } = useRecentListings();

  if (isLoading) {
    return <RecentListingsSkeleton />;
  }

  if (error) {
    return (
      <div className='text-muted-foreground py-8 text-center'>
        <Clock className='mx-auto mb-2 size-8 opacity-50' />
        <p>Failed to load recent listings</p>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className='text-muted-foreground py-8 text-center'>
        <Clock className='mx-auto mb-2 size-8 opacity-50' />
        <p>No recent listings available</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {listings.map((listing) => {
        const tier = getTierFromOverall(listing.playerOverall);
        const tierClasses = getTierClasses(tier);

        return (
          <Link
            key={`${listing.listingResourceId}-${listing.listingDate.getTime()}`}
            href={`/player/${listing.playerId}`}
            className='block'
          >
            <div className='bg-muted/50 hover:bg-muted/70 group flex items-center justify-between gap-4 rounded-lg px-3 py-2 transition-colors'>
              {/* Player Card Image */}
              <Image
                src={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${listing.playerId}/card.png`}
                alt={`${listing.playerName} card`}
                width={500}
                height={835}
                className='w-8 shrink-0 sm:w-10'
              />

              {/* Player Info */}
              <div className='flex flex-1 flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-base font-semibold transition-colors'>
                    {listing.playerName}
                  </span>
                  <Badge
                    variant='secondary'
                    className={cn(
                      'px-1.5 text-[10px] font-semibold',
                      tierClasses
                    )}
                  >
                    {listing.playerOverall}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-1'>
                  <Badge
                    variant='outline'
                    className='bg-background flex items-center gap-1 text-[10px] [&>svg]:size-2.5!'
                  >
                    <CrownIcon className='shrink-0' />
                    {listing.sellerName}
                  </Badge>
                  {listing.playerPositions[0] && (
                    <Badge variant='outline' className='text-[10px]'>
                      {listing.playerPositions[0]}
                    </Badge>
                  )}
                  <Badge variant='outline' className='text-[10px]'>
                    Age {listing.playerAge}
                  </Badge>
                </div>
              </div>

              {/* Listing Info */}
              <div className='flex items-center gap-4'>
                <div className='text-right'>
                  <p className='flex items-center justify-end gap-1 text-sm font-semibold text-blue-600'>
                    {listing.price.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'never',
                    })}
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    {listing.listingDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
