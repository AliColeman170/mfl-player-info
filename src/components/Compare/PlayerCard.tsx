import { ImageCard } from '../Player/ImageCard';
import { BasicInfo } from '../Player/BasicInfo';
import { cn } from '@/utils/helpers';
import { Suspense } from 'react';
import { SpinnerIcon } from '../SpinnerIcon';
import { CareerStats } from '../Player/CareerStats';

export async function PlayerCard({
  player,
  className,
}: {
  player: any;
  className?: string;
}) {
  if (!player) return null;
  return (
    <div
      className={cn(
        `mx-auto w-full max-w-xl transform self-stretch rounded-xl bg-white p-4 shadow-2xl shadow-slate-300 ring-1 ring-slate-950 ring-opacity-5 @container/main sm:p-6 lg:p-8 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800`,
        className
      )}
    >
      <div className='grid grid-flow-row grid-cols-1 gap-y-8 @sm:grid @sm:grid-cols-3 @sm:items-center @sm:gap-x-8 @sm:gap-y-4'>
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
    </div>
  );
}
