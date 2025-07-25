'use client';

import { usePlayerQuery } from '@/hooks/usePlayerQuery';
import { ClientPlayer } from './ClientPlayer';
import { Loader2Icon } from 'lucide-react';

interface ClientPlayerPageProps {
  playerId: number;
}

export function ClientPlayerPage({ playerId }: ClientPlayerPageProps) {
  const { data: player, isLoading, error } = usePlayerQuery(playerId);

  if (isLoading) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <Loader2Icon className='size-8 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center text-red-500'>
        Error loading player data
      </div>
    );
  }

  if (!player) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center text-gray-500'>
        Player not found
      </div>
    );
  }

  return (
    <div className='bg-background shadow-foreground/2 border-border @container/main mx-auto w-full max-w-xl transform rounded-xl border p-4 shadow-2xl sm:p-6 lg:px-8 lg:pb-8'>
      {/* Main Player Content */}
      <ClientPlayer playerId={playerId} />
    </div>
  );
}
