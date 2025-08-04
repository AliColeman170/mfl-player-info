import type { Player, PlayerStats, StatKey } from '@/types/global.types';
import { cn } from '@/utils/helpers';
import { StyledRatingValue } from './StyledRatingValue';
import { Button } from '../UI/button';
import { MinusIcon, PlusIcon } from '@heroicons/react/20/solid';

export function PlayerStatsTable({
  player,
  stats,
  isTrainingMode,
  minusStatValue,
  plusStatValue,
  resetStatValue,
}: {
  player: Player;
  stats: PlayerStats;
  isTrainingMode: boolean;
  minusStatValue: (key: StatKey) => void;
  plusStatValue: (key: StatKey) => void;
  resetStatValue: (key: StatKey) => void;
}) {
  return (
    <div className='grid grid-flow-row grid-cols-6 items-start justify-center'>
      {Object.entries(stats).map(([key]) => {
        if (key === 'goalkeeping') return null;
        return (
          <div
            key={key}
            className='border-border text-foreground/80 border-b px-1.5 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase'
          >
            {key.substring(0, 3)}
          </div>
        );
      })}
      {Object.entries(stats).map(([key, val]) => {
        if (key === 'goalkeeping') return null;
        const diff = val - player.metadata[key as StatKey];
        return (
          <div
            key={`${key}-${val}`}
            className='flex flex-col items-center justify-start gap-1.5 px-1 pt-2'
          >
            <div className='relative'>
              <StyledRatingValue rating={val} size='lg' />

              {diff > 0 ? (
                <div className='absolute -top-1 right-0 flex translate-x-1/2 items-center justify-center'>
                  <div
                    className={cn(
                      'rounded-sm px-1 text-[10px]/3.5 tabular-nums',
                      diff > 0 && 'bg-green-600 text-green-50',
                      diff === 0 && 'bg-secondary text-secondary-foreground',
                      diff < 0 && 'bg-red-500 text-white'
                    )}
                  >
                    {diff > 0 && '+'}
                    {diff}
                  </div>
                </div>
              ) : null}
            </div>
            {isTrainingMode && (
              <div className='grid grid-cols-2 justify-center gap-x-1 gap-y-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  className='h-6 has-[>svg]:px-2'
                  onClick={() => minusStatValue(key as StatKey)}
                >
                  <MinusIcon className='size-3' />
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  className='h-6 has-[>svg]:px-2'
                  onClick={() => plusStatValue(key as StatKey)}
                >
                  <PlusIcon className='size-3' />
                </Button>
                {diff !== 0 && (
                  <Button
                    variant='link'
                    onClick={() => resetStatValue(key as StatKey)}
                    className='col-span-2 h-auto py-0 text-xs'
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
