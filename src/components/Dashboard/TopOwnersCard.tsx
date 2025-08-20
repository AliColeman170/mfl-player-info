import { Suspense } from 'react';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/UI/badge';
import { Skeleton } from '@/components/UI/skeleton';
import { getTopOwners } from '@/data/dashboard';
import { CrownIcon, Users } from 'lucide-react';
import Link from 'next/link';

function TopOwnersSkeleton() {
  return (
    <div className='flex flex-col gap-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className='bg-muted/30 flex items-center gap-3 rounded-lg px-3 py-4'
        >
          <Skeleton className='h-4 w-6' />
          <div className='flex flex-1 flex-col gap-1'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-2 w-16' />
          </div>
          <Skeleton className='h-4 w-16' />
        </div>
      ))}
    </div>
  );
}

async function TopOwnersContent() {
  const owners = await getTopOwners(5);

  if (!owners || owners.length === 0) {
    return (
      <div className='text-muted-foreground py-6 text-center'>
        <CrownIcon className='mx-auto mb-2 size-6 opacity-50' />
        <p className='text-sm'>No top owners available</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {owners.map((owner, index) => {
        const displayName =
          owner.owner_name ||
          `${owner.owner_wallet_address.slice(0, 6)}...${owner.owner_wallet_address.slice(-4)}`;

        return (
          <Link
            href={`/players-table?walletAddress=${owner.owner_wallet_address}`}
            key={owner.owner_wallet_address}
            className='group bg-muted/50 hover:bg-muted/70 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors'
          >
            <div className='text-muted-foreground flex items-center px-1 text-sm/10 sm:px-2'>
              #{index + 1}
            </div>
            {/* Owner Info */}
            <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
              <div className='truncate text-sm font-medium'>{displayName}</div>
              <div className='flex items-center gap-1'>
                <Badge variant='outline' className='px-1 py-0 text-[9px]'>
                  {owner.owner_wallet_address}
                </Badge>
              </div>
            </div>

            {/* Player Count - Now the primary metric */}
            <div className='flex items-center gap-1 text-right'>
              <Users className='size-3 text-blue-600' />
              <span className='text-sm font-semibold text-blue-600'>
                {owner.player_count}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function TopOwnersCard() {
  return (
    <DashboardCard title='Top Owners' description='Owners with most players'>
      <Suspense fallback={<TopOwnersSkeleton />}>
        <TopOwnersContent />
      </Suspense>
    </DashboardCard>
  );
}
