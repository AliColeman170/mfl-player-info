"use client";

import {
  cn,
  getPlayerPositionRatings,
  getRarityClassNames,
} from "@/utils/helpers";
import PlayerStats from "./PlayerStats";
import { useState } from "react";
import { Switch } from "@headlessui/react";
import { PositionFamiliarityIndicator } from "./PositionFamiliarityIndicator";
import { StyledRatingValue } from "./StyledRatingValue";

interface PlayerStats {
  pace: number;
  dribbling: number;
  passing: number;
  shooting: number;
  defense: number;
  physical: number;
}

export const DifferenceBadge = ({ difference }) => {
  let colorClass = "";
  let text = difference.toString();

  if (difference > 0) {
    colorClass = "text-green-600";
    text = `+${difference}`;
  } else if (difference < 0) {
    colorClass = "text-red-600";
  } else {
    colorClass = "text-slate-400 dark:text-slate-200";
  }
  return (
    <span
      className={`inline-flex justify-center w-7 text-sm sm:text-base font-medium ${colorClass}`}
    >
      {text}
    </span>
  );
};

export default function PositionRatings({ player }) {
  const defaultPlayerStats = {
    pace: player.metadata.pace,
    dribbling: player.metadata.dribbling,
    passing: player.metadata.passing,
    shooting: player.metadata.shooting,
    defense: player.metadata.defense,
    physical: player.metadata.physical,
  };
  const [isTrainingMode, setIsTrainingMode] = useState<boolean>(false);

  const [stats, setStats] = useState<PlayerStats>(defaultPlayerStats);

  function handleToggleSwitch() {
    if (isTrainingMode) {
      setStats(defaultPlayerStats);
    }
    setIsTrainingMode(!isTrainingMode);
  }

  function resetStatValue(stat) {
    setStats({
      ...stats,
      [stat]: +player.metadata[stat],
    });
  }

  function plusStatValue(stat) {
    if (stats[stat] < 99) {
      setStats({
        ...stats,
        [stat]: +stats[stat] + 1,
      });
    }
  }
  function minusStatValue(stat) {
    if (stats[stat] > 0 && stats[stat] > defaultPlayerStats[stat]) {
      setStats({
        ...stats,
        [stat]: +stats[stat] - 1,
      });
    }
  }

  const positionRatings = getPlayerPositionRatings(player, true, stats);

  return (
    <>
      <PlayerStats
        player={player}
        stats={stats}
        isTrainingMode={isTrainingMode}
        minusStatValue={minusStatValue}
        plusStatValue={plusStatValue}
        resetStatValue={resetStatValue}
      />

      <div className="mt-12">
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-slate-900 dark:text-slate-200 font-bold tracking-tight text-2xl sm:text-3xl">
            Position Ratings
          </h2>
          <div className="mt-2 sm:mt-0 flex sm:flex-row-reverse justify-start sm:justify-end items-center gap-x-3">
            <Switch
              id="training-toggle"
              checked={isTrainingMode}
              onChange={handleToggleSwitch}
              className={cn(
                isTrainingMode ? "bg-indigo-600" : "bg-gray-300",
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  isTrainingMode ? "translate-x-5" : "translate-x-0",
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                )}
              />
            </Switch>
            <label
              htmlFor="training-toggle"
              className="text-sm text-right font-semibold"
            >
              Training Mode
            </label>
          </div>
        </div>
        <div className="mt-5 flow-root">
          <div className="-my-2 overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {positionRatings.map(({ positions, rating, difference }) => {
                    if (
                      positions.includes("GK") &&
                      !player.metadata.positions.includes("GK")
                    )
                      return null;
                    return (
                      <tr key={positions.join("-")}>
                        <td className="w-full whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-left font-medium text-slate-700 dark:text-slate-200 sm:pl-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm sm:text-base">
                              {positions.join(" / ")}
                            </span>
                            <PositionFamiliarityIndicator
                              player={player}
                              positions={positions}
                            />
                          </div>
                        </td>
                        <td className="flex items-center space-x-3 whitespace-nowrap px-1.5 sm:px-2 py-2.5 text-center font-medium text-slate-500 dark:text-slate-200">
                          <DifferenceBadge difference={difference} />
                          <StyledRatingValue rating={rating} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
