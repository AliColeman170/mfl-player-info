"use state";
import { cn } from "@/utils/helpers";
import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";

function FavouriteToggle({ column }) {
  const [enabled, setEnabled] = useState(column?.getFilterValue());

  useEffect(() => {
    setEnabled(column?.getFilterValue());
  }, [column?.getFilterValue()]);

  function handleChange() {
    if (enabled === true) {
      column?.setFilterValue(true);
    } else {
      column?.setFilterValue(undefined);
    }
  }

  function toggleNotFav() {
    if (enabled === false) {
      column?.setFilterValue(undefined);
    } else {
      column?.setFilterValue(false);
    }
  }

  function toggleFav() {
    if (enabled === true) {
      column?.setFilterValue(undefined);
    } else {
      column?.setFilterValue(true);
    }
  }
  function toggleDisableFav() {
    column?.setFilterValue(undefined);
  }

  return (
    <div
      className={cn(
        "relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 bg-slate-300 dark:bg-slate-800",
        enabled !== undefined && "bg-indigo-600"
      )}
    >
      <span className="sr-only">Filter Favourites</span>
      <div className="absolute inset-0 flex h-full w-full items-center justify-center">
        <button className="flex h-full w-full" onClick={toggleNotFav}></button>
        <button className="flex h-full w-8" onClick={toggleDisableFav}></button>
        <button className="flex h-full w-full" onClick={toggleFav}></button>
      </div>
      <span
        className={cn(
          "pointer-events-none relative inline-block h-8 w-8 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-3.5",
          enabled === true && "translate-x-7",
          enabled === false && "translate-x-0"
        )}
      >
        <span
          className={cn(
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity opacity-0 duration-100 ease-out",
            enabled === false && "opacity-100 duration-200 ease-in"
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-red-600"
          >
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M16.5 16.5 12 21l-7-7c-1.5-1.45-3-3.2-3-5.5a5.5 5.5 0 0 1 2.14-4.35" />
            <path d="M8.76 3.1c1.15.22 2.13.78 3.24 1.9 1.5-1.5 2.74-2 4.5-2A5.5 5.5 0 0 1 22 8.5c0 2.12-1.3 3.78-2.67 5.17" />
          </svg>
        </span>
        <span
          className={cn(
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity opacity-0 duration-100 ease-out",
            enabled === undefined && "opacity-100 duration-200 ease-in"
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-slate-400"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </span>
        <span
          className={cn(
            "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity opacity-0 duration-100 ease-out",
            enabled === true && "opacity-100 duration-200 ease-in"
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-red-500"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </span>
      </span>
    </div>
  );
}

export default FavouriteToggle;
