'use client';

import {
  getPlayerPositionFamiliarityRatings,
  getPlayerPositionRatings,
} from '@/utils/helpers';
import { PlayerStatsTable } from './PlayerStats';
import { useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/UI/popover';
import { Switch } from '@/components/UI/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/UI/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/UI/collapsible';
import {
  PositionFamiliarityIndicator,
  PositionalFamiliarityIndicator,
} from './PositionFamiliarityIndicator';
import { StyledRatingValue } from './StyledRatingValue';
import { positionalFamiliarity } from '@/config';
import type { Player, PlayerStats, StatKey } from '@/types/global.types';
import { Button } from '../UI/button';
import {
  SettingsIcon,
  ChevronDownIcon,
  FoldVerticalIcon,
  UnfoldVerticalIcon,
  ArrowDownFromLineIcon,
  ArrowUpToLineIcon,
  ChevronsUpDownIcon,
} from 'lucide-react';

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
      className={`inline-flex justify-center text-sm font-medium tabular-nums ${colorClass}`}
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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
      <div className='mt-6'>
        <PlayerStatsTable
          player={player}
          stats={stats}
          isTrainingMode={isTrainingMode}
          minusStatValue={minusStatValue}
          plusStatValue={plusStatValue}
          resetStatValue={resetStatValue}
        />
      </div>

      <div className='mt-6'>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className='bg-card border-border flex items-center justify-between rounded-md border py-1.5 pr-2 pl-4'>
            <div className='flex items-center gap-1.5'>
              <h2 className='text-base font-semibold'>Position Ratings</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='ghost' size='icon' className='size-7 p-1'>
                    <SettingsIcon className='size-3.5' />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className='w-60' align='end'>
                  <div className='grid gap-y-3.5'>
                    <div className='flex items-center justify-between gap-x-2'>
                      <label
                        htmlFor='training-toggle'
                        className='text-right text-sm font-semibold'
                      >
                        Training
                      </label>
                      <Switch
                        id='training-toggle'
                        checked={isTrainingMode}
                        onCheckedChange={handleToggleSwitch}
                      />
                    </div>
                    <div className='flex items-center justify-between gap-x-2'>
                      <label
                        htmlFor='pos-familiarity-toggle'
                        className='text-sm font-semibold text-nowrap'
                      >
                        Pos. Familiarity
                      </label>
                      <Switch
                        id='pos-familiarity-toggle'
                        checked={enablePositionalFamiliarity}
                        onCheckedChange={setEnablePositionalFamiliarity}
                      />
                    </div>
                    <div className='flex items-center justify-between gap-x-2'>
                      <label
                        htmlFor='captain-toggle'
                        className='text-right text-sm font-semibold text-nowrap'
                      >
                        Make Captain
                      </label>
                      <Switch
                        id='captain-toggle'
                        checked={isCaptain}
                        onCheckedChange={setIsCaptain}
                      />
                    </div>
                    {!isCaptain && (
                      <div className='flex items-center justify-between gap-x-2'>
                        <label className='text-right text-sm font-semibold text-nowrap'>
                          Captain Pos.
                        </label>
                        <Select
                          value={captainPosition || 'none'}
                          onValueChange={(value) =>
                            setCaptainPosition(value === 'none' ? '' : value)
                          }
                        >
                          <SelectTrigger className='w-full max-w-22' size='sm'>
                            <SelectValue placeholder='' />
                          </SelectTrigger>
                          <SelectContent
                            className='w-[var(--radix-select-trigger-width)] min-w-22'
                            align='end'
                          >
                            <SelectItem value='none'>
                              <span className='text-muted-foreground'>
                                None
                              </span>
                            </SelectItem>
                            {positionalFamiliarity.map((pos) => (
                              <SelectItem
                                key={pos.primaryPosition}
                                value={pos.primaryPosition}
                              >
                                {pos.primaryPosition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <CollapsibleTrigger asChild>
              <Button variant='ghost' size='sm' className='p-1'>
                <ChevronsUpDownIcon />
                <span className='sr-only'>Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className='divide-border mt-1 grid divide-y'>
            {enablePositionalFamiliarity ? (
              <>
                {/* First two positions always visible */}
                {playerPositionFamiliarityRatings
                  .filter(
                    ({ position }) =>
                      !(
                        position === 'GK' &&
                        !player.metadata.positions.includes('GK')
                      )
                  )
                  .slice(0, 3)
                  .map(({ position, rating, difference }) => (
                    <div
                      key={position}
                      className='grid grid-cols-2 py-1.5 pr-3 pl-4'
                    >
                      <div className='flex items-center gap-3'>
                        <span className='text-sm'>{position}</span>
                        <PositionalFamiliarityIndicator
                          player={player}
                          position={position}
                        />
                      </div>
                      <div className='flex items-center justify-end gap-3 text-center font-medium whitespace-nowrap'>
                        <DifferenceBadge difference={difference} />
                        <StyledRatingValue rating={rating} size='sm' />
                      </div>
                    </div>
                  ))}

                {/* Collapsible content for remaining positions */}
                {playerPositionFamiliarityRatings.filter(
                  ({ position }) =>
                    !(
                      position === 'GK' &&
                      !player.metadata.positions.includes('GK')
                    )
                ).length > 3 && (
                  <CollapsibleContent className='divide-border grid divide-y'>
                    {playerPositionFamiliarityRatings
                      .filter(
                        ({ position }) =>
                          !(
                            position === 'GK' &&
                            !player.metadata.positions.includes('GK')
                          )
                      )
                      .slice(2)
                      .map(({ position, rating, difference }) => (
                        <div
                          key={position}
                          className='grid grid-cols-2 py-1.5 pr-3 pl-4'
                        >
                          <div className='flex items-center gap-3'>
                            <span className='text-sm'>{position}</span>
                            <PositionalFamiliarityIndicator
                              player={player}
                              position={position}
                            />
                          </div>
                          <div className='flex items-center justify-end gap-3 text-center font-medium whitespace-nowrap'>
                            <DifferenceBadge difference={difference} />
                            <StyledRatingValue rating={rating} size='sm' />
                          </div>
                        </div>
                      ))}
                  </CollapsibleContent>
                )}
              </>
            ) : (
              <>
                {/* First two positions always visible */}
                {positionRatings
                  .filter(
                    ({ positions }) =>
                      !(
                        positions.includes('GK') &&
                        !player.metadata.positions.includes('GK')
                      )
                  )
                  .slice(0, 3)
                  .map(({ positions, rating, difference }) => (
                    <div
                      key={positions.join('-')}
                      className='grid grid-cols-2 py-1.5 pr-3 pl-4'
                    >
                      <div className='flex w-full items-center gap-3 text-left font-medium whitespace-nowrap'>
                        <span className='text-sm'>{positions.join(' / ')}</span>
                        <PositionFamiliarityIndicator
                          player={player}
                          positions={positions}
                        />
                      </div>
                      <div className='flex items-center justify-end gap-3 text-center font-medium whitespace-nowrap'>
                        <DifferenceBadge difference={difference} />
                        <StyledRatingValue rating={rating} size='sm' />
                      </div>
                    </div>
                  ))}

                {/* Collapsible content for remaining positions */}
                {positionRatings.filter(
                  ({ positions }) =>
                    !(
                      positions.includes('GK') &&
                      !player.metadata.positions.includes('GK')
                    )
                ).length > 3 && (
                  <CollapsibleContent className='divide-border grid divide-y'>
                    {positionRatings
                      .filter(
                        ({ positions }) =>
                          !(
                            positions.includes('GK') &&
                            !player.metadata.positions.includes('GK')
                          )
                      )
                      .slice(2)
                      .map(({ positions, rating, difference }) => (
                        <div
                          key={positions.join('-')}
                          className='grid grid-cols-2 py-1.5 pr-3 pl-4'
                        >
                          <div className='flex w-full items-center gap-3 text-left font-medium whitespace-nowrap'>
                            <span className='text-sm'>
                              {positions.join(' / ')}
                            </span>
                            <PositionFamiliarityIndicator
                              player={player}
                              positions={positions}
                            />
                          </div>
                          <div className='flex items-center justify-end gap-3 text-center font-medium whitespace-nowrap'>
                            <DifferenceBadge difference={difference} />
                            <StyledRatingValue rating={rating} size='sm' />
                          </div>
                        </div>
                      ))}
                  </CollapsibleContent>
                )}
              </>
            )}
          </div>
        </Collapsible>
      </div>
    </>
  );
}
