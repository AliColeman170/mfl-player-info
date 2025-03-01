import type { Player, PlayerStats, StatKey } from '@/types/global.types';
import { cn, getRarityClassNames } from '@/utils/helpers';
import { StyledRatingValue } from './StyledRatingValue';
import { Button } from '../UI/Button';
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
            className='border-border text-muted-foreground border-b px-1.5 py-1 text-center text-sm font-semibold tracking-wide whitespace-nowrap uppercase first:pl-0 last:pr-0 sm:px-2 sm:text-base'
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
            className='my-4 flex flex-col items-center justify-start gap-1.5 px-1'
          >
            <StyledRatingValue rating={val} />
            {isTrainingMode && (
              <div className='grid grid-cols-2 justify-center gap-x-1 gap-y-1.5'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => minusStatValue(key as StatKey)}
                >
                  <MinusIcon className='size-4' />
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => plusStatValue(key as StatKey)}
                >
                  <PlusIcon className='size-4' />
                </Button>
                <div className='col-span-2 flex justify-center'>
                  <div
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px]',
                      diff > 0 && 'bg-green-600 text-green-50',
                      diff === 0 && 'bg-secondary text-secondary-foreground',
                      diff < 0 && 'bg-red-500 text-white'
                    )}
                  >
                    {diff > 0 && '+'}
                    {diff}
                  </div>
                </div>
                {diff !== 0 && (
                  <Button
                    variant='link'
                    onClick={() => resetStatValue(key as StatKey)}
                    className='col-span-2 h-auto py-0.5 text-xs'
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
