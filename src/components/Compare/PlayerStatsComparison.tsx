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
    <div className='bg-card shadow-foreground/3 ring-border col-span-2 mx-auto w-full transform rounded-xl p-4 shadow-2xl ring-1 sm:p-6'>
      <div className='divide-border -my-2 grid divide-y sm:-my-3'>
        {!isGKComparision &&
          stats.map((stat) => (
            <div key={stat} className='grid grid-cols-3 gap-x-1.5 py-2'>
              <div className='flex items-center gap-x-1.5 sm:gap-x-3'>
                <StyledRatingValue rating={player1Stats[stat as StatKey]} />
                {player1Stats[stat as StatKey] >
                  player2Stats[stat as StatKey] && (
                  <StarIcon className='size-4 text-yellow-400' />
                )}
              </div>
              <span className='text-muted-foreground flex items-center justify-center text-sm leading-6 font-semibold uppercase sm:text-base'>
                {stat}
              </span>
              <div className='flex items-center justify-end gap-x-3'>
                {player2Stats[stat as StatKey] >
                  player1Stats[stat as StatKey] && (
                  <StarIcon className='size-4 text-yellow-400' />
                )}
                <StyledRatingValue rating={player2Stats[stat as StatKey]} />
              </div>
            </div>
          ))}
        {(isPlayer1Goalkeeper || isPlayer2Goalkeeper) && (
          <div className='grid grid-cols-3 gap-x-1.5 py-2 sm:p-2'>
            <div className='flex items-center gap-x-1.5 sm:gap-x-3'>
              <StyledRatingValue rating={player1.metadata.goalkeeping} />
              {player1.metadata.goalkeeping > player2.metadata.goalkeeping && (
                <StarIcon className='size-4 text-yellow-400' />
              )}
            </div>
            <span className='text-muted-foreground flex items-center justify-center text-sm leading-6 font-semibold uppercase sm:text-base'>
              Goalkeeping
            </span>
            <div className='flex items-center justify-end gap-x-3'>
              {player2.metadata.goalkeeping > player1.metadata.goalkeeping && (
                <StarIcon className='size-4 text-yellow-400' />
              )}
              <StyledRatingValue rating={player2.metadata.goalkeeping} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
