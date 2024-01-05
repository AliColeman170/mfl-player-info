"use state";
import { cn } from "@/utils/helpers";
import { Switch } from "@headlessui/react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

function FavouriteToggle({ column }) {
  const [enabled, setEnabled] = useState(
    column?.getFilterValue() ? true : false
  );

  useEffect(() => {
    setEnabled(column?.getFilterValue() ? true : false);
  }, [column?.getFilterValue()]);

  function handleChange(enabled) {
    if (enabled) {
      column?.setFilterValue(true);
    } else {
      column?.setFilterValue(undefined);
    }
  }

  return (
    <Switch
      checked={enabled}
      onChange={handleChange}
      className={cn(
        enabled ? "bg-indigo-600" : "bg-gray-200",
        "relative inline-flex h-9 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-gray-950"
      )}
    >
      <span className="sr-only">Filter Favourites</span>
      <span
        className={cn(
          enabled ? "translate-x-5" : "translate-x-0",
          "pointer-events-none relative inline-block h-8 w-8 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        )}
      >
        <span
          className={cn(
            enabled
              ? "opacity-0 duration-100 ease-out"
              : "opacity-100 duration-200 ease-in",
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
          )}
          aria-hidden="true"
        >
          <HeartIcon className="h-4 w-4 text-gray-400" />
        </span>
        <span
          className={cn(
            enabled
              ? "opacity-100 duration-200 ease-in"
              : "opacity-0 duration-100 ease-out",
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity"
          )}
          aria-hidden="true"
        >
          <HeartIconSolid className="h-4 w-4 text-red-500" />
        </span>
      </span>
    </Switch>
  );
}

export default FavouriteToggle;
