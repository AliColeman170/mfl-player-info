import { Player } from "@/types/global";
import { getPlayerPositionRatings, getRarityClassNames } from "@/utils/helpers";
import { DifferenceBadge } from "../Player/PositionRatings";

export function PositionFamiliarityIndicator({ positions, player }) {
  if (positions.includes(player.metadata.positions[0])) {
    return (
      <span className="inline-flex bg-indigo-600 items-center justify-center leading-none rounded text-white text-[10px] px-2 py-1">
        P
      </span>
    );
  }
  if (
    positions.includes(player.metadata.positions[1]) ||
    positions.includes(player.metadata.positions[2])
  ) {
    return (
      <span className="inline-flex bg-slate-300 items-center justify-center leading-none rounded text-slate-900 text-[10px] px-2 py-1">
        S
      </span>
    );
  }
  return null;
}

export default function PositionRatingsComparison({
  player1,
  player2,
}: {
  player1: Player;
  player2: Player;
}) {
  const isPlayer1Goalkeeper = player1.metadata.positions.includes("GK");
  const isPlayer2Goalkeeper = player2.metadata.positions.includes("GK");
  const isGKComparision = isPlayer1Goalkeeper && isPlayer2Goalkeeper;

  const player1PositionRatings = getPlayerPositionRatings(player1);
  const player2PositionRatings = getPlayerPositionRatings(player2);

  return (
    <div className="col-span-2 mx-auto w-full transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 p-4 sm:p-6 lg:p-8">
      <div className="grid divide-y divide-slate-200 dark:divide-slate-700">
        {!isGKComparision &&
          player1PositionRatings.map(({ positions }, index) => {
            if (
              positions.includes("GK") &&
              !isPlayer1Goalkeeper &&
              !isPlayer2Goalkeeper
            )
              return null;
            return (
              <div key={index} className="grid grid-cols-[auto_1fr_auto] p-2">
                <div className="flex items-center justify-start gap-x-3">
                  <span
                    className={`${getRarityClassNames(
                      player1PositionRatings[index].rating
                    )} rounded-lg text-base sm:text-lg w-12 p-2.5 sm:p-3 font-medium text-center`}
                  >
                    {player1PositionRatings[index].rating > 0
                      ? player1PositionRatings[index].rating
                      : 0}
                  </span>
                  <DifferenceBadge
                    difference={player1PositionRatings[index].difference}
                  />
                </div>
                <div className="grid items-center grid-cols-[1fr_3fr_1fr] gap-x-8 text-center space-x-2 text-sm sm:text-base font-semibold uppercase leading-6 text-slate-700 dark:text-slate-400">
                  <div className="flex justify-end">
                    <PositionFamiliarityIndicator
                      positions={player1PositionRatings[index].positions}
                      player={player1}
                    />
                  </div>
                  <div className="text-sm sm:text-base">
                    {player1PositionRatings[index].positions.join(" / ")}
                  </div>
                  <div className="flex justify-start">
                    <PositionFamiliarityIndicator
                      positions={player2PositionRatings[index].positions}
                      player={player2}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-x-3">
                  <DifferenceBadge
                    difference={player2PositionRatings[index].difference}
                  />
                  <span
                    className={`${getRarityClassNames(
                      player2PositionRatings[index].rating
                    )} rounded-lg text-base sm:text-lg w-12 p-2.5 sm:p-3 font-medium text-center`}
                  >
                    {player2PositionRatings[index].rating > 0
                      ? player2PositionRatings[index].rating
                      : 0}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
