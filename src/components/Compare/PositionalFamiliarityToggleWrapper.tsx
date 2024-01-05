"use client";

import { cn } from "@/utils/helpers";
import { Switch } from "@headlessui/react";
import { useState } from "react";
import PositionalRatingsComparison from "./PositionalRatingsComparison";
import PositionRatingsComparison from "./PositionRatingsComparison";

export function PositionalFamiliarityToggleWrapper({ player1, player2 }) {
  const [enablePositionalFamiliarity, setEnablePositionalFamiliarity] =
    useState<boolean>(false);

  return (
    <>
      <div className="col-span-2 self-end px-4">
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
              enablePositionalFamiliarity ? "bg-indigo-600" : "bg-gray-300",
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                enablePositionalFamiliarity ? "translate-x-5" : "translate-x-0",
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              )}
            />
          </Switch>
        </div>
      </div>
      {enablePositionalFamiliarity ? (
        <PositionalRatingsComparison player1={player1} player2={player2} />
      ) : (
        <PositionRatingsComparison player1={player1} player2={player2} />
      )}
    </>
  );
}
