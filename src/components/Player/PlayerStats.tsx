import type { Player, PlayerStats, StatKey } from '@/types/global.types';
import { cn, getRarityClassNames } from '@/utils/helpers';

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
    <div className='flow-root'>
      <div className='-my-3 overflow-x-auto'>
        <div className='inline-block min-w-full py-2 align-middle'>
          <table className='min-w-full divide-y divide-slate-300 dark:divide-slate-700'>
            <thead>
              <tr>
                {Object.entries(stats).map(([key]) => {
                  if (key === 'goalkeeping') return null;
                  return (
                    <th
                      key={key}
                      scope='col'
                      className='whitespace-nowrap px-1.5 py-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-700 first:pl-0 last:pr-0 sm:px-2 sm:text-base dark:text-slate-400'
                    >
                      {key.substring(0, 3)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-950'>
              <tr>
                {Object.entries(stats).map(([key, val]) => {
                  if (key === 'goalkeeping') return null;
                  const diff = val - player.metadata[key as StatKey];
                  return (
                    <td
                      key={`${key}-${val}`}
                      className='whitespace-nowrap px-1.5 py-4 text-center align-top text-base text-slate-500 first:pl-0 last:pr-0 sm:px-2 sm:py-5 sm:text-lg dark:text-slate-200'
                    >
                      <div
                        className={`${getRarityClassNames(
                          val
                        )} relative inline-flex rounded-lg p-2.5 font-medium leading-6 sm:p-3`}
                      >
                        {val >= 0 ? val : '–'}
                      </div>
                      {isTrainingMode && (
                        <div className='mt-2 grid grid-cols-2 gap-x-1 gap-y-1'>
                          <button
                            onClick={() => minusStatValue(key as StatKey)}
                            className='flex cursor-pointer items-center justify-center rounded-md bg-slate-100 py-1 text-sm font-semibold ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/50'
                          >
                            -
                          </button>
                          <button
                            onClick={() => plusStatValue(key as StatKey)}
                            className='flex cursor-pointer items-center justify-center rounded-md bg-slate-100 py-1 text-sm font-semibold ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/50'
                          >
                            +
                          </button>
                          <div className='col-span-2'>
                            <span
                              className={cn(
                                'rounded-md px-2 py-0.5 text-sm',
                                diff > 0 && 'bg-green-600 text-white',
                                diff === 0 && 'bg-white text-slate-900',
                                diff < 0 && 'bg-red text-slate-900'
                              )}
                            >
                              {diff > 0 && '+'}
                              {diff}
                            </span>
                          </div>
                          {diff !== 0 && (
                            <button
                              onClick={() => resetStatValue(key as StatKey)}
                              className='col-span-2 text-xs text-indigo-500 hover:text-indigo-400'
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
