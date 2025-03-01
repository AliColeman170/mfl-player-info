import { Player } from '@/types/global.types';
import { getPlayerPositionFamiliarityRatings } from '@/utils/helpers';
import { DifferenceBadge } from '../Player/PositionRatings';
import { StyledRatingValue } from '../Player/StyledRatingValue';
import { PositionalFamiliarityIndicator } from '../Player/PositionFamiliarityIndicator';

export function PositionalRatingsComparison({
  player1,
  player2,
}: {
  player1: Player;
  player2: Player;
}) {
  const isPlayer1Goalkeeper = player1.metadata.positions.includes('GK');
  const isPlayer2Goalkeeper = player2.metadata.positions.includes('GK');
  const isGKComparision = isPlayer1Goalkeeper && isPlayer2Goalkeeper;

  const player1PositionRatings = getPlayerPositionFamiliarityRatings(player1);
  const player2PositionRatings = getPlayerPositionFamiliarityRatings(player2);

  if (isGKComparision) return null;

  return (
    <div className='bg-card shadow-foreground/3 ring-border ring-opacity-5 col-span-2 mx-auto w-full transform rounded-xl p-4 shadow-2xl ring-1 sm:p-6'>
      <div className='divide-border -my-2 grid divide-y sm:-my-3'>
        {player1PositionRatings.map(({ position }, index) => {
          if (position === 'GK' && !isPlayer1Goalkeeper && !isPlayer2Goalkeeper)
            return null;
          return (
            <div
              key={index}
              className='grid grid-cols-[auto_1fr_auto] gap-x-1.5 py-2'
            >
              <div className='flex items-center justify-start gap-x-1.5 sm:gap-x-3'>
                <StyledRatingValue
                  rating={player1PositionRatings[index].rating}
                />
                <DifferenceBadge
                  difference={player1PositionRatings[index].difference}
                />
              </div>
              <div className='text-muted-foreground grid grid-cols-[1fr_3fr_1fr] items-center gap-x-1.5 space-x-2 text-center text-sm leading-6 font-semibold uppercase sm:gap-x-8 sm:text-base'>
                <div className='flex justify-end'>
                  <PositionalFamiliarityIndicator
                    position={player1PositionRatings[index].position}
                    player={player1}
                  />
                </div>
                <div className='text-sm sm:text-base'>
                  {player1PositionRatings[index].position}
                </div>
                <div className='flex justify-start'>
                  <PositionalFamiliarityIndicator
                    position={player2PositionRatings[index].position}
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
