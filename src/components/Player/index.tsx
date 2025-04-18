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
    <div className='bg-card shadow-foreground/5 outline-border @container/main mx-auto w-full max-w-xl transform rounded-xl p-4 shadow-2xl outline-1 -outline-offset-1 sm:p-6 lg:p-8'>
      <div className='grid grid-cols-1 gap-y-8 @sm/main:grid-cols-3 @sm/main:items-center @sm/main:gap-8'>
        <ImageCard player={player} />
        <BasicInfo player={player} />
        <Suspense
          fallback={
            <div className='col-span-3 flex justify-center py-2'>
              <SpinnerIcon className='text-muted size-6 animate-spin' />
            </div>
          }
        >
          <CareerStats player={player} />
        </Suspense>
      </div>
      {isGoalkeeper ? (
        <GoalkeeperStats player={player} />
      ) : (
        <PositionRatings player={player} />
      )}
      <Suspense
        fallback={
          <div className='flex justify-center py-8'>
            <SpinnerIcon className='text-muted size-6 animate-spin' />
          </div>
        }
      >
        <ContractStats player={player} />
      </Suspense>
    </div>
  );
}
