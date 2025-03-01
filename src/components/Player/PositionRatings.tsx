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
import { Button } from '../UI/Button';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

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
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight sm:text-3xl'>
            Position Ratings
          </h2>
          <Popover className='relative'>
            <PopoverButton as={Button} variant='outline' size='lg'>
              <Cog8ToothIcon />
            </PopoverButton>

            <PopoverPanel className='bg-popover shadow-foreground/5 ring-border absolute right-0 z-10 mt-1 w-60 space-y-4 rounded-lg p-4 text-sm shadow-2xl ring-1'>
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
                      isTrainingMode ? 'bg-primary' : 'bg-secondary',
                      'focus:ring-primary focus:ring-offset-popover relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-hidden'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        isTrainingMode ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
                <div className='flex items-center justify-between gap-x-3'>
                  <label
                    htmlFor='training-toggle'
                    className='text-sm font-semibold text-nowrap'
                  >
                    Pos. Familiarity
                  </label>
                  <Switch
                    id='training-toggle'
                    checked={enablePositionalFamiliarity}
                    onChange={setEnablePositionalFamiliarity}
                    className={cn(
                      enablePositionalFamiliarity
                        ? 'bg-primary'
                        : 'bg-secondary',
                      'focus:ring-primary focus:ring-offset-popover relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-hidden'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        enablePositionalFamiliarity
                          ? 'translate-x-5'
                          : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
                <div className='flex items-center justify-between gap-x-3'>
                  <label
                    htmlFor='training-toggle'
                    className='text-right text-sm font-semibold text-nowrap'
                  >
                    Make Captain
                  </label>
                  <Switch
                    id='training-toggle'
                    checked={isCaptain}
                    onChange={setIsCaptain}
                    className={cn(
                      isCaptain ? 'bg-primary' : 'bg-secondary',
                      'focus:ring-primary focus:ring-offset-popover relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-hidden'
                    )}
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        isCaptain ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out'
                      )}
                    />
                  </Switch>
                </div>
                {!isCaptain && (
                  <div className='flex items-center justify-between gap-x-3'>
                    <label
                      htmlFor='captainPosition'
                      className='text-right text-sm font-semibold text-nowrap'
                    >
                      Captain Pos.
                    </label>
                    <div className='grid grid-cols-1'>
                      <select
                        id='captainPosition'
                        name='captainPosition'
                        className='focus:outline-primary bg-card outline-border col-start-1 row-start-1 w-full appearance-none rounded-md py-1.5 pr-8 pl-3 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2'
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
                      <ChevronDownIcon
                        aria-hidden='true'
                        className='pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4'
                      />
                    </div>
                  </div>
                )}
              </div>
            </PopoverPanel>
          </Popover>
        </div>
        <div className='divide-border mt-5 grid divide-y'>
          {enablePositionalFamiliarity ? (
            <>
              {playerPositionFamiliarityRatings.map(
                ({ position, rating, difference }) => {
                  if (
                    position === 'GK' &&
                    !player.metadata.positions.includes('GK')
                  ) {
                    return null;
                  }
                  return (
                    <div key={position} className='grid grid-cols-2 py-1.5'>
                      <div className='flex items-center gap-3'>
                        <span className='text-sm sm:text-base'>{position}</span>
                        <PositionalFamiliarityIndicator
                          player={player}
                          position={position}
                        />
                      </div>
                      <div className='flex items-center justify-end gap-3 text-center font-medium whitespace-nowrap'>
                        <DifferenceBadge difference={difference} />
                        <StyledRatingValue rating={rating} />
                      </div>
                    </div>
                  );
                }
              )}
            </>
          ) : (
            <>
              {positionRatings.map(({ positions, rating, difference }) => {
                if (
                  positions.includes('GK') &&
                  !player.metadata.positions.includes('GK')
                )
                  return null;
                return (
                  <div
                    key={positions.join('-')}
                    className='grid grid-cols-2 py-1.5'
                  >
                    <div className='flex w-full items-center gap-3 text-left font-medium whitespace-nowrap'>
                      <span className='text-sm sm:text-base'>
                        {positions.join(' / ')}
                      </span>
                      <PositionFamiliarityIndicator
                        player={player}
                        positions={positions}
                      />
                    </div>
                    <div className='flex items-center justify-end gap-3 text-center font-medium whitespace-nowrap'>
                      <DifferenceBadge difference={difference} />
                      <StyledRatingValue rating={rating} />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}
