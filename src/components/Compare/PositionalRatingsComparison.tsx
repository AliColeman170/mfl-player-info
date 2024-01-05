import { Player } from "@/types/global";
import { getPlayerPositionFamiliarityRatings } from "@/utils/helpers";
import { DifferenceBadge } from "../Player/PositionRatings";
import { StyledRatingValue } from "../Player/StyledRatingValue";
import {
  PositionFamiliarityIndicator,
  PositionalFamiliarityIndicator,
} from "../Player/PositionFamiliarityIndicator";

export default function PositionalRatingsComparison({
  player1,
  player2,
}: {
  player1: Player;
  player2: Player;
}) {
  const isPlayer1Goalkeeper = player1.metadata.positions.includes("GK");
  const isPlayer2Goalkeeper = player2.metadata.positions.includes("GK");
  const isGKComparision = isPlayer1Goalkeeper && isPlayer2Goalkeeper;

  const player1PositionRatings = getPlayerPositionFamiliarityRatings(player1);
  const player2PositionRatings = getPlayerPositionFamiliarityRatings(player2);

  if (isGKComparision) return null;

  return (
    <div className="col-span-2 mx-auto w-full transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 p-4 sm:p-6 lg:p-8">
      <div className="grid divide-y divide-slate-200 dark:divide-slate-700">
        {player1PositionRatings.map(({ position }, index) => {
          if (position === "GK" && !isPlayer1Goalkeeper && !isPlayer2Goalkeeper)
            return null;
          return (
            <div
              key={index}
              className="grid grid-cols-[auto_1fr_auto] py-2 sm:p-2 gap-x-1.5"
            >
              <div className="flex items-center justify-start gap-x-1.5 sm:gap-x-3">
                <StyledRatingValue
                  rating={player1PositionRatings[index].rating}
                />
                <DifferenceBadge
                  difference={player1PositionRatings[index].difference}
                />
              </div>
              <div className="grid items-center grid-cols-[1fr_3fr_1fr] gap-x-1.5 sm:gap-x-8 text-center space-x-2 text-sm sm:text-base font-semibold uppercase leading-6 text-slate-700 dark:text-slate-400">
                <div className="flex justify-end">
                  <PositionalFamiliarityIndicator
                    position={player1PositionRatings[index].position}
                    player={player1}
                  />
                </div>
                <div className="text-sm sm:text-base">
                  {player1PositionRatings[index].position}
                </div>
                <div className="flex justify-start">
                  <PositionalFamiliarityIndicator
                    position={player2PositionRatings[index].position}
                    player={player2}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-x-1.5 sm:gap-x-3">
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
