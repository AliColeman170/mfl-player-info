import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/20/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { Suspense } from 'react';
import { FavouriteButton } from './FavouriteButton';
import { ForSale } from './ForSale';
import { PlayerContract } from './PlayerContract';
import { Player } from '@/types/global.types';

function LoadingFavouriteButton() {
  return (
    <div className='flex cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/50'>
      <SpinnerIcon className='h-5 w-5 animate-spin text-slate-500' />
    </div>
  );
}

export function ImageCard({ player }: { player: Player }) {
  return (
    <div className='mx-auto w-full max-w-xs @container/image @sm:mx-0'>
      <Image
        className='mx-auto -mt-2 w-full max-w-[200px] px-2 @sm:max-w-none'
        src={`https://d13e14gtps4iwl.cloudfront.net/players/${player.id}/card_512.png`}
        alt={`Player ${player.id} - ${player.metadata.firstName} ${player.metadata.lastName}`}
        width='512'
        height='748'
        unoptimized
        priority
      />
      <div className='mt-3 flex flex-col items-center justify-center gap-1'>
        <PlayerContract player={player} />
        <Suspense>
          <ForSale player={player} />
        </Suspense>
      </div>
      <div className='mt-4 flex items-center justify-center space-x-1.5'>
        <Suspense fallback={<LoadingFavouriteButton />}>
          <FavouriteButton player={player} />
        </Suspense>
        <Link
          href={{
            pathname: '/compare',
            query: {
              player1: player.id,
              player2: '',
            },
          }}
          className='flex cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-sm font-semibold ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 sm:px-3 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/50'
        >
          <ArrowsRightLeftIcon className='h-4 w-4' />
        </Link>
        <Link
          href={`https://app.playmfl.com/players/${player.id}`}
          target='_blank'
          className='hidden cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-slate-100 px-2.5 py-2 text-sm font-semibold ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 @[124px]/image:flex sm:px-3 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/50'
        >
          <ArrowTopRightOnSquareIcon className='-mr-0.5 h-4 w-4' />
        </Link>
      </div>
    </div>
  );
}
