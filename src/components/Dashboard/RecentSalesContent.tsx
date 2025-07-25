'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { useRecentSales } from '@/hooks/useRecentSales';
import { Clock, CrownIcon } from 'lucide-react';
import { getTierFromOverall, getTierClasses } from '@/lib/tier-colors';
import { cn } from '@/lib/utils';

function RecentSalesSkeleton() {
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
          <div className='flex flex-col items-end gap-1 text-right'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-3 w-20' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentSalesContent() {
  const { data: sales, isLoading, error } = useRecentSales();

  if (isLoading) {
    return <RecentSalesSkeleton />;
  }

  if (error) {
    return (
      <div className='text-muted-foreground py-8 text-center'>
        <Clock className='mx-auto mb-2 size-8 opacity-50' />
        <p>Failed to load recent sales</p>
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className='text-muted-foreground py-8 text-center'>
        <Clock className='mx-auto mb-2 size-8 opacity-50' />
        <p>No recent sales data available</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {sales.map((sale) => {
        const tier = getTierFromOverall(sale.playerOverall);
        const tierClasses = getTierClasses(tier);

        return (
          <Link
            key={`${sale.listingResourceId}-${sale.purchaseDate.getTime()}`}
            href={`/player/${sale.playerId}`}
            className='block'
          >
            <div className='bg-muted/50 hover:bg-muted/70 group flex items-center gap-4 rounded-lg px-3 py-2 transition-colors'>
              {/* Player Card Image */}
              <Image
                src={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${sale.playerId}/card.png`}
                alt={`${sale.playerName} card`}
                width={500}
                height={835}
                className='w-10 shrink-0'
              />

              {/* Player Info */}
              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-base font-semibold'>
                    {sale.playerName}
                  </span>
                  <Badge
                    variant='secondary'
                    className={cn('border', tierClasses)}
                  >
                    #{sale.playerId}
                  </Badge>
                </div>
                <div className='flex items-center gap-1'>
                  <Badge
                    variant='outline'
                    className='bg-background flex items-center gap-1 text-[10px] [&>svg]:size-2.5!'
                  >
                    <CrownIcon className='shrink-0' />
                    {sale.buyerName}
                  </Badge>
                  {sale.playerPositions[0] && (
                    <Badge variant='outline' className='text-[10px]'>
                      {sale.playerPositions[0]}
                    </Badge>
                  )}
                  <Badge variant='outline' className='text-[10px]'>
                    Age {sale.playerAge}
                  </Badge>
                </div>
              </div>

              {/* Sale Info */}
              <div className='shrink-0 text-right'>
                <p className='flex items-center justify-end gap-1 text-sm font-semibold text-green-600'>
                  {sale.price.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {sale.purchaseDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
