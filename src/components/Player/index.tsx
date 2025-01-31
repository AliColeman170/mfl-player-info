import { BasicInfo } from './BasicInfo';
import { ImageCard } from './ImageCard';
import { GoalkeeperStats } from './GoalkeeperStats';
import { PositionRatings } from './PositionRatings';
import { ContractStats } from './ContractStats';
import { Suspense } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { CareerStats } from './CareerStats';
import type { Player } from '@/types/global.types';

export default function Player({ player }: { player: Player }) {
  const isGoalkeeper = player.metadata.positions.includes('GK');

  return (
    <div className='mx-auto w-full max-w-xl transform rounded-xl bg-white p-4 shadow-2xl shadow-slate-300 ring-1 ring-slate-950 ring-opacity-5 @container/main sm:p-6 lg:p-8 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800'>
      <div className='grid grid-cols-1 gap-y-8 @sm/main:grid-cols-3 @sm/main:items-center @sm/main:gap-8'>
        <ImageCard player={player} />
        <BasicInfo player={player} />
        <Suspense
          fallback={
            <div className='col-span-3 flex justify-center py-2'>
              <SpinnerIcon className='h-6 w-6 animate-spin text-slate-400' />
            </div>
          }
        >
          <CareerStats player={player} />
        </Suspense>
      </div>
      {isGoalkeeper && <GoalkeeperStats player={player} />}
      {!isGoalkeeper && <PositionRatings player={player} />}
      <Suspense
        fallback={
          <div className='flex justify-center py-8'>
            <SpinnerIcon className='h-6 w-6 animate-spin text-slate-400' />
          </div>
        }
      >
        <ContractStats player={player} />
      </Suspense>
    </div>
  );
}
