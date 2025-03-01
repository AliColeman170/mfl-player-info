'use client';
import { PlayerWithFavouriteData } from '@/types/global.types';
import dynamic from 'next/dynamic';
import { SpinnerIcon } from '../SpinnerIcon';

const Table = dynamic(() => import('@/components/Table').then((c) => c.Table), {
  ssr: false,
  loading: () => (
    <div className='flex h-64 items-center justify-center'>
      <SpinnerIcon className='size-8 animate-spin' />
    </div>
  ),
});

export function TableWrapper({
  players,
}: {
  players: PlayerWithFavouriteData[];
}) {
  return (
    <div className='py-8'>
      <Table players={players} />
    </div>
  );
}
