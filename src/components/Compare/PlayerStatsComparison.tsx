import { Player, PlayerStats } from '@/types/global.types';
import { cn } from '@/utils/helpers';
import { StarIcon } from '@heroicons/react/20/solid';
import { StyledRatingValue } from '../Player/StyledRatingValue';

type NonGKPlayerStats = Omit<PlayerStats, 'goalkeeping'>;

type StatKey = keyof NonGKPlayerStats;

export async function PlayerStatsComparison({
  player1,
  player2,
}: {
  player1: Player;
  player2: Player;
}) {
  const isPlayer1Goalkeeper = player1.metadata.positions.includes('GK');
  const isPlayer2Goalkeeper = player2.metadata.positions.includes('GK');
  const isGKComparision = isPlayer1Goalkeeper && isPlayer2Goalkeeper;

  const stats = [
    'pace',
    'dribbling',
    'passing',
    'shooting',
    'defense',
    'physical',
  ];

  const player1Stats: NonGKPlayerStats = {
    pace: player1.metadata.pace,
    dribbling: player1.metadata.dribbling,
    passing: player1.metadata.passing,
    shooting: player1.metadata.shooting,
    defense: player1.metadata.defense,
    physical: player1.metadata.physical,
  };

  const player2Stats: NonGKPlayerStats = {
    pace: player2.metadata.pace,
    dribbling: player2.metadata.dribbling,
    passing: player2.metadata.passing,
    shooting: player2.metadata.shooting,
    defense: player2.metadata.defense,
    physical: player2.metadata.physical,
  };

  return (
    <div className='col-span-2 mx-auto w-full transform rounded-xl bg-white p-4 shadow-2xl shadow-slate-300 ring-1 ring-slate-950 ring-opacity-5 sm:p-6 lg:p-8 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800'>
      <div className='grid divide-y divide-slate-200 dark:divide-slate-700'>
        {!isGKComparision &&
          stats.map((stat) => (
            <div key={stat} className='grid grid-cols-3 gap-x-1.5 py-2 sm:p-2'>
              <div className='flex items-center gap-x-1.5 sm:gap-x-3'>
                <StyledRatingValue rating={player1Stats[stat as StatKey]} />
                <StarIcon
                  className={cn(
                    'h-4 w-4',
                    player1Stats[stat as StatKey] >
                      player2Stats[stat as StatKey]
                      ? 'text-yellow-400'
                      : 'text-white dark:text-slate-900'
                  )}
                />
              </div>
              <span className='flex items-center justify-center text-sm font-semibold uppercase leading-6 text-slate-700 sm:text-base dark:text-slate-400'>
                {stat}
              </span>
              <div className='flex items-center justify-end gap-x-3'>
                <StarIcon
                  className={cn(
                    'h-4 w-4',
                    player2Stats[stat as StatKey] >
                      player1Stats[stat as StatKey]
                      ? 'text-yellow-400'
                      : 'text-white dark:text-slate-900'
                  )}
                />
                <StyledRatingValue rating={player2Stats[stat as StatKey]} />
              </div>
            </div>
          ))}
        {(isPlayer1Goalkeeper || isPlayer2Goalkeeper) && (
          <div className='grid grid-cols-3 gap-x-1.5 py-2 sm:p-2'>
            <div className='flex items-center gap-x-1.5 sm:gap-x-3'>
              <StyledRatingValue rating={player1.metadata.goalkeeping} />
              <StarIcon
                className={cn(
                  'h-4 w-4',
                  player1.metadata.goalkeeping > player2.metadata.goalkeeping
                    ? 'text-yellow-400'
                    : 'text-white dark:text-slate-900'
                )}
              />
            </div>
            <span className='flex items-center justify-center text-sm font-semibold uppercase leading-6 text-slate-700 sm:text-base dark:text-slate-400'>
              Goalkeeping
            </span>
            <div className='flex items-center justify-end gap-x-3'>
              <StarIcon
                className={cn(
                  'h-4 w-4',
                  player2.metadata.goalkeeping > player1.metadata.goalkeeping
                    ? 'text-yellow-400'
                    : 'text-white dark:text-slate-900'
                )}
              />
              <StyledRatingValue rating={player2.metadata.goalkeeping} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
