import { Player } from '@/types/global.types';
import { getPlayerPositionRatings } from '@/utils/helpers';
import { DifferenceBadge } from '../Player/PositionRatings';
import { StyledRatingValue } from '../Player/StyledRatingValue';
import { PositionFamiliarityIndicator } from '../Player/PositionFamiliarityIndicator';

export function PositionRatingsComparison({
  player1,
  player2,
}: {
  player1: Player;
  player2: Player;
}) {
  const isPlayer1Goalkeeper = player1.metadata.positions.includes('GK');
  const isPlayer2Goalkeeper = player2.metadata.positions.includes('GK');
  const isGKComparision = isPlayer1Goalkeeper && isPlayer2Goalkeeper;

  const player1PositionRatings = getPlayerPositionRatings(player1);
  const player2PositionRatings = getPlayerPositionRatings(player2);

  if (isGKComparision) return null;

  return (
    <div className='col-span-2 mx-auto w-full transform rounded-xl bg-white p-4 shadow-2xl shadow-slate-300 ring-1 ring-slate-950 ring-opacity-5 sm:p-6 lg:p-8 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800'>
      <div className='grid divide-y divide-slate-200 dark:divide-slate-700'>
        {player1PositionRatings.map(({ positions }, index) => {
          if (
            positions.includes('GK') &&
            !isPlayer1Goalkeeper &&
            !isPlayer2Goalkeeper
          )
            return null;
          return (
            <div
              key={index}
              className='grid grid-cols-[auto_1fr_auto] gap-x-1.5 py-2 sm:p-2'
            >
              <div className='flex items-center justify-start gap-x-1.5 sm:gap-x-3'>
                <StyledRatingValue
                  rating={player1PositionRatings[index].rating}
                />
                <DifferenceBadge
                  difference={player1PositionRatings[index].difference}
                />
              </div>
              <div className='grid grid-cols-[1fr_3fr_1fr] items-center gap-x-1.5 space-x-2 text-center text-sm font-semibold uppercase leading-6 text-slate-700 sm:gap-x-8 sm:text-base dark:text-slate-400'>
                <div className='flex justify-end'>
                  <PositionFamiliarityIndicator
                    positions={player1PositionRatings[index].positions}
                    player={player1}
                  />
                </div>
                <div className='text-sm sm:text-base'>
                  {player1PositionRatings[index].positions.join(' / ')}
                </div>
                <div className='flex justify-start'>
                  <PositionFamiliarityIndicator
                    positions={player2PositionRatings[index].positions}
                    player={player2}
                  />
                </div>
              </div>
              <div className='flex items-center justify-end gap-x-1.5 sm:gap-x-3'>
                <DifferenceBadge
                  difference={player2PositionRatings[index].difference}
                />
                <StyledRatingValue
                  rating={player2PositionRatings[index].rating}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
