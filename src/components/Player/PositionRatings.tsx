"use client";

import {
  cn,
  getPlayerPositionFamiliarityRatings,
  getPlayerPositionRatings,
} from "@/utils/helpers";
import PlayerStats from "./PlayerStats";
import { useMemo, useState } from "react";
import { Popover, Switch } from "@headlessui/react";
import {
  PositionFamiliarityIndicator,
  PositionalFamiliarityIndicator,
} from "./PositionFamiliarityIndicator";
import { StyledRatingValue } from "./StyledRatingValue";
import { captainBoost, positionalFamiliarity } from "@/config";
import { Cog8ToothIcon, CogIcon } from "@heroicons/react/24/outline";

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
  const [enablePositionalFamiliarity, setEnablePositionalFamiliarity] =
    useState<boolean>(false);
  const [isCaptain, setIsCaptain] = useState<boolean>(false);
  const [captainPosition, setCaptainPosition] = useState<string>("");

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

  const positionRatings = useMemo(
    () =>
      getPlayerPositionRatings(player, true, stats, isCaptain, captainPosition),
    [stats, isCaptain, captainPosition]
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
    [stats, isCaptain, captainPosition]
  );

  return (
    <>
      <div className="mt-4">
        <PlayerStats
          player={player}
          stats={stats}
          isTrainingMode={isTrainingMode}
          minusStatValue={minusStatValue}
          plusStatValue={plusStatValue}
          resetStatValue={resetStatValue}
        />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-900 dark:text-slate-200 font-bold tracking-tight text-2xl sm:text-3xl">
            Position Ratings
          </h2>
          <Popover className="relative">
            <Popover.Button className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900/60 px-4 py-3 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5">
              <Cog8ToothIcon className="h-5 w-5" />
            </Popover.Button>

            <Popover.Panel className="absolute right-0 mt-1 z-10 w-60 space-y-4 rounded-lg bg-white dark:bg-slate-950 p-4 text-sm shadow-2xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5">
              <div className="grid grid-cols-1 gap-y-4">
                <div className="flex justify-between items-center gap-x-3">
                  <label
                    htmlFor="training-toggle"
                    className="text-sm text-right font-semibold"
                  >
                    Training
                  </label>
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
                </div>
                <div className="flex justify-between items-center gap-x-3">
                  <label
                    htmlFor="training-toggle"
                    className="text-sm font-semibold text-nowrap"
                  >
                    Pos. Familiarity
                  </label>
                  <Switch
                    id="training-toggle"
                    checked={enablePositionalFamiliarity}
                    onChange={setEnablePositionalFamiliarity}
                    className={cn(
                      enablePositionalFamiliarity
                        ? "bg-indigo-600"
                        : "bg-gray-300",
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        enablePositionalFamiliarity
                          ? "translate-x-5"
                          : "translate-x-0",
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      )}
                    />
                  </Switch>
                </div>
                <div className="flex justify-between items-center gap-x-3">
                  <label
                    htmlFor="training-toggle"
                    className="text-sm text-right font-semibold text-nowrap"
                  >
                    Make Captain
                  </label>
                  <Switch
                    id="training-toggle"
                    checked={isCaptain}
                    onChange={setIsCaptain}
                    className={cn(
                      isCaptain ? "bg-indigo-600" : "bg-gray-300",
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        isCaptain ? "translate-x-5" : "translate-x-0",
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      )}
                    />
                  </Switch>
                </div>
                {!isCaptain && (
                  <div className="flex justify-between items-center gap-x-3">
                    <label
                      htmlFor="captainPosition"
                      className="text-sm text-right font-semibold text-nowrap"
                    >
                      Captain Pos.
                    </label>
                    <select
                      id="captainPosition"
                      name="captainPosition"
                      className="block w-auto rounded-md border-0 py-1.5 pl-3 pr-10 bg-white dark:bg-slate-900 text-slate-900 shadow-2xl shadow-slate-200 dark:shadow-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
                      value={captainPosition}
                      onChange={(e) => setCaptainPosition(e.target.value)}
                    >
                      <option value=""></option>
                      {positionalFamiliarity.map((pos) => (
                        <option
                          key={pos.primaryPosition}
                          value={pos.primaryPosition}
                        >
                          {pos.primaryPosition}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Popover.Panel>
          </Popover>
        </div>
        <div className="mt-5 flow-root">
          <div className="-my-2 overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {enablePositionalFamiliarity ? (
                    <>
                      {playerPositionFamiliarityRatings.map(
                        ({ position, rating, difference }) => {
                          if (
                            position === "GK" &&
                            !player.metadata.positions.includes("GK")
                          )
                            return null;
                          return (
                            <tr key={position}>
                              <td className="w-full whitespace-nowrap px-1.5 sm:px-2 py-4 sm:py-5 text-left font-medium text-slate-700 dark:text-slate-200 sm:pl-1">
                                <div className="flex items-center space-x-3">
                                  <span className="text-sm sm:text-base">
                                    {position}
                                  </span>
                                  <PositionalFamiliarityIndicator
                                    player={player}
                                    position={position}
                                  />
                                </div>
                              </td>
                              <td className="flex items-center space-x-3 whitespace-nowrap px-1.5 sm:px-2 py-2.5 text-center font-medium text-slate-500 dark:text-slate-200">
                                <DifferenceBadge difference={difference} />
                                <StyledRatingValue rating={rating} />
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </>
                  ) : (
                    <>
                      {positionRatings.map(
                        ({ positions, rating, difference }) => {
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
                        }
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
