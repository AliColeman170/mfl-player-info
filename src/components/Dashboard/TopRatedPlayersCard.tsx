import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { getTopRatedPlayers } from '@/data/dashboard';
import { Trophy } from 'lucide-react';
import { StyledRatingValue } from '../Player/StyledRatingValue';

function TopRatedPlayersSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='bg-muted/30 flex items-center gap-3 rounded-lg p-2 py-3'
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

async function TopRatedPlayersContent() {
  const players = await getTopRatedPlayers(5);

  if (!players || players.length === 0) {
    return (
      <div className='text-muted-foreground py-6 text-center'>
        <Trophy className='mx-auto mb-2 size-6 opacity-50' />
        <p className='text-sm'>No top rated players available</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {players.map((player) => {
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
                <div className='truncate text-sm font-medium'>
                  {player.first_name} {player.last_name}
                </div>
                <div className='flex flex-wrap items-center gap-1'>
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

              {/* Rank */}
              <div className='text-right'>
                <StyledRatingValue rating={player.overall!} size='sm' />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function TopRatedPlayersCard() {
  return (
    <DashboardCard
      title='Top Rated Players'
      description='Highest overall rated players'
    >
      <Suspense fallback={<TopRatedPlayersSkeleton />}>
        <TopRatedPlayersContent />
      </Suspense>
    </DashboardCard>
  );
}
