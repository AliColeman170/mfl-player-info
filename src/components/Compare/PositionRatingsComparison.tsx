import { Player } from '@/types/global.types';
import { getPlayerPositionRatings } from '@/utils/helpers';
import { DifferenceBadge } from '../Player/PositionRatings';
import { StyledRatingValue } from '../Player/StyledRatingValue';
import { PositionFamiliarityIndicator } from '../Player/PositionFamiliarityIndicator';
import { Fragment } from 'react';

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
    <div className='bg-card shadow-foreground/3 ring-border ring-opacity-5 col-span-2 mx-auto w-full transform rounded-xl p-4 shadow-2xl ring-1 sm:p-6'>
      <div className='divide-border -my-2 grid divide-y sm:-my-3'>
        <div className='[&_>_div]:divide-border grid grid-cols-[1fr_auto_1fr] [&_>_div]:border-b [&_>_div]:py-2 [&_>_div[data-last=true]]:border-b-0'>
          {player1PositionRatings.map(({ positions }, index) => {
            if (
              positions.includes('GK') &&
              !isPlayer1Goalkeeper &&
              !isPlayer2Goalkeeper
            )
              return null;
            return (
              <Fragment key={index}>
                <div
                  data-last={
                    index === player1PositionRatings.length - 1
                      ? 'true'
                      : undefined
                  }
                  className='flex items-center justify-start gap-x-2 sm:gap-x-3'
                >
                  <StyledRatingValue
                    rating={player1PositionRatings[index].rating}
                  />
                  <DifferenceBadge
                    difference={player1PositionRatings[index].difference}
                  />
                </div>
                <div
                  data-last={
                    index === player1PositionRatings.length - 1
                      ? 'true'
                      : undefined
                  }
                  className='text-muted-foreground grid grid-cols-[1fr_3fr_1fr] items-center gap-x-3 text-center text-sm leading-6 font-semibold uppercase sm:gap-x-8 sm:text-base'
                >
                  <div className='flex justify-end'>
                    <PositionFamiliarityIndicator
                      positions={player1PositionRatings[index].positions}
                      player={player1}
                    />
                  </div>
                  <div className='truncate text-sm sm:text-base'>
                    {player1PositionRatings[index].positions.join(' / ')}
                  </div>
                  <div className='flex justify-start'>
                    <PositionFamiliarityIndicator
                      positions={player2PositionRatings[index].positions}
                      player={player2}
                    />
                  </div>
                </div>
                <div
                  data-last={
                    index === player1PositionRatings.length - 1
                      ? 'true'
                      : undefined
                  }
                  className='flex items-center justify-end gap-x-2 sm:gap-x-3'
                >
                  <DifferenceBadge
                    difference={player2PositionRatings[index].difference}
                  />
                  <StyledRatingValue
                    rating={player2PositionRatings[index].rating}
                  />
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
