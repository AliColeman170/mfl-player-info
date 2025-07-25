import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { getFavoritePlayers } from '@/data/dashboard';
import { getTierFromOverall, getTierClasses } from '@/lib/tier-colors';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';

function FavoritePlayersSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='bg-muted/30 flex items-center gap-3 rounded-lg p-2'
        >
          <Skeleton className='h-8 w-6 shrink-0' />
          <div className='flex-1 space-y-1'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-2 w-16' />
          </div>
          <Skeleton className='h-4 w-8' />
        </div>
      ))}
    </div>
  );
}

async function FavoritePlayersContent() {
  const players = await getFavoritePlayers(5);

  if (!players || players.length === 0) {
    return (
      <div className='text-muted-foreground py-6 text-center'>
        <Heart className='mx-auto mb-2 size-6 opacity-50' />
        <p className='text-sm'>No favorite players available</p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      {players.map((player) => {
        const tier = getTierFromOverall(player.overall!);
        const tierClasses = getTierClasses(tier);

        return (
          <Link key={player.id} href={`/player/${player.id}`} className='block'>
            <div className='group bg-muted/50 hover:bg-muted/70 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors'>
              {/* Player Card Image */}
              <Image
                src={`https://d13e14gtps4iwl.cloudfront.net/players/v2/${player.id}/card.png`}
                alt={`${player.first_name} ${player.last_name} card`}
                width={500}
                height={835}
                className='w-6 shrink-0'
              />

              {/* Player Info */}
              <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <div className='flex items-center gap-1.5'>
                  <span className='truncate text-sm font-medium'>
                    {player.first_name} {player.last_name}
                  </span>
                  <Badge
                    variant='secondary'
                    className={cn('text-[10px]', tierClasses)}
                  >
                    {player.overall}
                  </Badge>
                </div>
                <div className='flex items-center gap-1'>
                  {player.primary_position && (
                    <Badge variant='outline' className='px-1 py-0 text-[9px]'>
                      {player.primary_position}
                    </Badge>
                  )}
                  <Badge variant='outline' className='px-1 py-0 text-[9px]'>
                    Age {player.age}
                  </Badge>
                </div>
              </div>

              {/* Favorite Count */}
              <div className='flex items-center gap-1 text-right'>
                <Heart className='size-3 fill-red-500 text-red-500' />
                <span className='text-muted-foreground text-sm font-semibold'>
                  {player.favorite_count}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function FavoritePlayersCard() {
  return (
    <DashboardCard
      title='Favorite Players'
      description='Most favorited players by users'
    >
      <Suspense fallback={<FavoritePlayersSkeleton />}>
        <FavoritePlayersContent />
      </Suspense>
    </DashboardCard>
  );
}
