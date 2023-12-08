import { Player } from "@/types/global";
import { cn, getRarityClassNames } from "@/utils/helpers";
import { StarIcon } from "@heroicons/react/20/solid";

export async function PlayerStatsComparison({
  player1,
  player2,
}: {
  player1: Player;
  player2: Player;
}) {
  const isPlayer1Goalkeeper = player1.metadata.positions.includes("GK");
  const isPlayer2Goalkeeper = player2.metadata.positions.includes("GK");
  const isGKComparision = isPlayer1Goalkeeper && isPlayer2Goalkeeper;

  const stats = [
    "pace",
    "dribbling",
    "passing",
    "shooting",
    "defense",
    "physical",
  ];

  const player1Stats = {
    pace: player1.metadata.pace,
    dribbling: player1.metadata.dribbling,
    passing: player1.metadata.passing,
    shooting: player1.metadata.shooting,
    defense: player1.metadata.defense,
    physical: player1.metadata.physical,
  };

  const player2Stats = {
    pace: player2.metadata.pace,
    dribbling: player2.metadata.dribbling,
    passing: player2.metadata.passing,
    shooting: player2.metadata.shooting,
    defense: player2.metadata.defense,
    physical: player2.metadata.physical,
  };

  return (
    <div className="col-span-2 mx-auto w-full transform rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 p-4 sm:p-6 lg:p-8">
      <div className="grid  divide-y divide-slate-200 dark:divide-slate-700">
        {!isGKComparision &&
          stats.map((stat) => (
            <div key={stat} className="grid grid-cols-3 p-2">
              <div className="flex items-center gap-x-3">
                <div
                  className={`${getRarityClassNames(
                    player1Stats[stat]
                  )} relative inline-flex rounded-lg w-12 p-2.5 sm:p-3 font-medium leading-6 justify-center`}
                >
                  {player1Stats[stat] >= 0 ? player1Stats[stat] : "–"}
                </div>
                <StarIcon
                  className={cn(
                    "h-4 w-4",
                    player1Stats[stat] > player2Stats[stat]
                      ? "text-yellow-400"
                      : "text-white dark:text-slate-900"
                  )}
                />
              </div>
              <span className="flex items-center justify-center text-sm sm:text-base font-semibold uppercase leading-6 text-slate-700 dark:text-slate-400">
                {stat}
              </span>
              <div className="flex items-center justify-end gap-x-3">
                <StarIcon
                  className={cn(
                    "h-4 w-4",
                    player2Stats[stat] > player1Stats[stat]
                      ? "text-yellow-400"
                      : "text-white dark:text-slate-900"
                  )}
                />
                <div
                  className={`${getRarityClassNames(
                    player2Stats[stat]
                  )} relative inline-flex rounded-lg w-12 p-2.5 sm:p-3 font-medium leading-6 justify-center`}
                >
                  {player2Stats[stat] >= 0 ? player2Stats[stat] : "–"}
                </div>
              </div>
            </div>
          ))}
        {(isPlayer1Goalkeeper || isPlayer2Goalkeeper) && (
          <div className="grid grid-cols-3 p-2">
            <div className="flex items-center gap-x-3">
              <div
                className={`${getRarityClassNames(
                  player1.metadata.goalkeeping
                )} relative inline-flex rounded-lg w-12 p-2.5 sm:p-3 font-medium leading-6 justify-center`}
              >
                {+player1.metadata.goalkeeping >= 0
                  ? player1.metadata.goalkeeping
                  : "–"}
              </div>
              <StarIcon
                className={cn(
                  "h-4 w-4",
                  player1.metadata.goalkeeping > player2.metadata.goalkeeping
                    ? "text-yellow-400"
                    : "text-white dark:text-slate-900"
                )}
              />
            </div>
            <span className="flex items-center justify-center text-sm sm:text-base font-semibold uppercase leading-6 text-slate-700 dark:text-slate-400">
              Goalkeeping
            </span>
            <div className="flex items-center justify-end gap-x-3">
              <StarIcon
                className={cn(
                  "h-4 w-4",
                  player2.metadata.goalkeeping > player1.metadata.goalkeeping
                    ? "text-yellow-400"
                    : "text-white dark:text-slate-900"
                )}
              />
              <div
                className={`${getRarityClassNames(
                  player2.metadata.goalkeeping
                )} relative inline-flex rounded-lg w-12 p-2.5 sm:p-3 font-medium leading-6 justify-center`}
              >
                {+player2.metadata.goalkeeping >= 0
                  ? player2.metadata.goalkeeping
                  : "–"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
