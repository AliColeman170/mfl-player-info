'use client';

import {
  cn,
  getPlayerPositionFamiliarityRatings,
  getPlayerPositionRatings,
} from '@/utils/helpers';
import { PlayerStatsTable } from './PlayerStats';
import { useMemo, useState } from 'react';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Switch,
} from '@headlessui/react';
import {
  PositionFamiliarityIndicator,
  PositionalFamiliarityIndicator,
} from './PositionFamiliarityIndicator';
import { StyledRatingValue } from './StyledRatingValue';
import { positionalFamiliarity } from '@/config';
import { Cog8ToothIcon } from '@heroicons/react/24/outline';
import type { Player, PlayerStats, StatKey } from '@/types/global.types';

export const DifferenceBadge = ({ difference }: { difference: number }) => {
  let colorClass = '';
  let text = difference.toString();

  if (difference > 0) {
    colorClass = 'text-green-600';
    text = `+${difference}`;
  } else if (difference < 0) {
    colorClass = 'text-red-600';
  } else {
    colorClass = 'text-slate-400 dark:text-slate-200';
  }
  return (
    <span
      className={`inline-flex w-7 justify-center text-sm font-medium sm:text-base ${colorClass}`}
    >
      {text}
    </span>
  );
};

export function PositionRatings({ player }: { player: Player }) {
  const defaultPlayerStats: PlayerStats = {
    pace: player.metadata.pace,
    dribbling: player.metadata.dribbling,
    passing: player.metadata.passing,
    shooting: player.metadata.shooting,
    defense: player.metadata.defense,
    physical: player.metadata.physical,
    goalkeeping: player.metadata.goalkeeping,
  };
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(false);
  const [enablePositionalFamiliarity, setEnablePositionalFamiliarity] =
    useState<boolean>(true);
  const [isCaptain, setIsCaptain] = useState<boolean>(false);
  const [captainPosition, setCaptainPosition] = useState<string>('');

  const [stats, setStats] = useState<PlayerStats>(defaultPlayerStats);

  function handleToggleSwitch() {
    if (isTrainingMode) {
      setStats(defaultPlayerStats);
    }
    setIsTrainingMode(!isTrainingMode);
  }

  function resetStatValue(stat: StatKey) {
    setStats({
      ...stats,
      [stat]: player.metadata[stat],
    });
  }

  function plusStatValue(stat: StatKey) {
    if (stats[stat] < 99) {
      setStats({
        ...stats,
        [stat]: +stats[stat] + 1,
      });
    }
  }
  function minusStatValue(stat: StatKey) {
    if (stats[stat] > 0 && stats[stat] > defaultPlayerStats[stat]) {
      setStats({
        ...stats,
        [stat]: +stats[stat] - 1,
      });
    }
  }

  const positionRatings = useMemo(
    () =>
      getPlayerPositionRatings(player, true, stats, isCaptain, captainPosition),
    [player, stats, isCaptain, captainPosition]
  );

  const playerPositionFamiliarityRatings = useMemo(
    () =>
      getPlayerPositionFamiliarityRatings(
        player,
        true,
        stats,
        isCaptain,
        captainPosition
      ),
    [player, stats, isCaptain, captainPosition]
  );

  return (
    <>
      <div className='mt-8'>
        <PlayerStatsTable
          player={player}
          stats={stats}
          isTrainingMode={isTrainingMode}
          minusStatValue={minusStatValue}
          plusStatValue={plusStatValue}
          resetStatValue={resetStatValue}
        />
      </div>

      <div className='mt-8'>
        <div className='flex items-center justify-between pr-1.5 sm:pr-2'>
          <h2 className='text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-200'>
            Position Ratings
          </h2>
          <Popover className='relative'>
            <PopoverButton className='cursor-pointer rounded-lg bg-slate-100 px-4 py-3 ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-900/60'>
              <Cog8ToothIcon className='h-5 w-5' />
            </PopoverButton>

            <PopoverPanel className='absolute right-0 z-10 mt-1 w-60 space-y-4 rounded-lg bg-white p-4 text-sm shadow-2xl shadow-slate-200 ring-1 ring-slate-950 ring-opacity-5 dark:bg-slate-950 dark:shadow-slate-900 dark:ring-slate-800'>
              <div className='grid grid-cols-1 gap-y-4'>
                <div className='flex items-center justify-between gap-x-3'>
                  <label
                    htmlFor='training-toggle'
                    className='text-right text-sm font-semibold'
                  >
                    Training
                  </label>
                  <Switch
                    id='training-toggle'
                    checked={isTrainingMode}
                    onChange={handleToggleSwitch}
                    className={cn(
                      isTrainingMode
                        ? 'bg-indigo-600'
                        : 'bg-slate-300 dark:bg-slate-800',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        isTrainingMode ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
                <div className='flex items-center justify-between gap-x-3'>
                  <label
                    htmlFor='training-toggle'
                    className='text-nowrap text-sm font-semibold'
                  >
                    Pos. Familiarity
                  </label>
                  <Switch
                    id='training-toggle'
                    checked={enablePositionalFamiliarity}
                    onChange={setEnablePositionalFamiliarity}
                    className={cn(
                      enablePositionalFamiliarity
                        ? 'bg-indigo-600'
                        : 'bg-slate-300 dark:bg-slate-800',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        enablePositionalFamiliarity
                          ? 'translate-x-5'
                          : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
                <div className='flex items-center justify-between gap-x-3'>
                  <label
                    htmlFor='training-toggle'
                    className='text-nowrap text-right text-sm font-semibold'
                  >
                    Make Captain
                  </label>
                  <Switch
                    id='training-toggle'
                    checked={isCaptain}
                    onChange={setIsCaptain}
                    className={cn(
                      isCaptain
                        ? 'bg-indigo-600'
                        : 'bg-slate-300 dark:bg-slate-800',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        isCaptain ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
                {!isCaptain && (
                  <div className='flex items-center justify-between gap-x-3'>
                    <label
                      htmlFor='captainPosition'
                      className='text-nowrap text-right text-sm font-semibold'
                    >
                      Captain Pos.
                    </label>
                    <select
                      id='captainPosition'
                      name='captainPosition'
                      className='block w-auto rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-slate-900 shadow-2xl shadow-slate-200 ring-1 ring-slate-950 ring-opacity-5 placeholder:text-slate-400 focus:ring-0 dark:bg-slate-900 dark:text-white dark:shadow-slate-900 dark:ring-slate-800'
                      value={captainPosition}
                      onChange={(e) => setCaptainPosition(e.target.value)}
                    >
                      <option value=''></option>
                      {positionalFamiliarity.map((pos) => (
                        <option
                          key={pos.primaryPosition}
                          value={pos.primaryPosition}
                        >
                          {pos.primaryPosition}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </PopoverPanel>
          </Popover>
        </div>
        <div className='mt-5 flow-root'>
          <div className='-my-2 overflow-x-auto'>
            <div className='inline-block min-w-full align-middle'>
              <table className='min-w-full divide-y divide-slate-300 dark:divide-slate-700'>
                <tbody className='divide-y divide-slate-200 dark:divide-slate-700'>
                  {enablePositionalFamiliarity ? (
                    <>
                      {playerPositionFamiliarityRatings.map(
                        ({ position, rating, difference }) => {
                          if (
                            position === 'GK' &&
                            !player.metadata.positions.includes('GK')
                          )
                            return null;
                          return (
                            <tr key={position}>
                              <td className='w-full whitespace-nowrap px-1.5 py-4 text-left font-medium text-slate-700 sm:px-2 sm:py-5 sm:pl-1 dark:text-slate-200'>
                                <div className='flex items-center space-x-3'>
                                  <span className='text-sm sm:text-base'>
                                    {position}
                                  </span>
                                  <PositionalFamiliarityIndicator
                                    player={player}
                                    position={position}
                                  />
                                </div>
                              </td>
                              <td className='flex items-center space-x-3 whitespace-nowrap px-1.5 py-2.5 text-center font-medium text-slate-500 sm:px-2 dark:text-slate-200'>
                                <DifferenceBadge difference={difference} />
                                <StyledRatingValue rating={rating} />
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </>
                  ) : (
                    <>
                      {positionRatings.map(
                        ({ positions, rating, difference }) => {
                          if (
                            positions.includes('GK') &&
                            !player.metadata.positions.includes('GK')
                          )
                            return null;
                          return (
                            <tr key={positions.join('-')}>
                              <td className='w-full whitespace-nowrap px-1.5 py-4 text-left font-medium text-slate-700 sm:px-2 sm:py-5 sm:pl-1 dark:text-slate-200'>
                                <div className='flex items-center space-x-3'>
                                  <span className='text-sm sm:text-base'>
                                    {positions.join(' / ')}
                                  </span>
                                  <PositionFamiliarityIndicator
                                    player={player}
                                    positions={positions}
                                  />
                                </div>
                              </td>
                              <td className='flex items-center space-x-3 whitespace-nowrap px-1.5 py-2.5 text-center font-medium text-slate-500 sm:px-2 dark:text-slate-200'>
                                <DifferenceBadge difference={difference} />
                                <StyledRatingValue rating={rating} />
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
