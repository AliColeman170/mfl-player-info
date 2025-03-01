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
        `bg-card shadow-foreground/3 ring-border @container/main mx-auto w-full max-w-xl transform self-stretch rounded-xl p-4 shadow-2xl ring-1 sm:p-6`,
        className
      )}
    >
      <div className='grid grid-flow-row grid-cols-1 gap-y-8 @sm:grid @sm:grid-cols-3 @sm:items-center @sm:gap-x-8 @sm:gap-y-4'>
        <ImageCard player={player} />
        <BasicInfo player={player} />
        <Suspense
          fallback={
            <div className='col-span-3 flex justify-center py-2'>
              <SpinnerIcon className='text-muted h-6 w-6 animate-spin' />
            </div>
          }
        >
          <CareerStats player={player} />
        </Suspense>
      </div>
    </div>
  );
}
