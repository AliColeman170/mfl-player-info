"use client";

import { XMarkIcon } from "@heroicons/react/24/solid";
import { ViewOptions } from "./ViewOptions";
import FilterOptions from "./FilterOptions";
import { DebouncedInput } from "../DebouncedInput";
import { positionOrderArray } from "@/utils/helpers";
import { useState } from "react";
import { NumberFilter } from "./NumberFilter";
import { FacetedFilter } from "./FacetedFilter";
import { columnLabels } from "./columns";
import FacetedRadioFilter from "./FacetedRadioFilter";
import Image from "next/image";

export function Toolbar({ table }) {
  const [showFilterControls, setShowFilterControls] = useState(false);
  const isFiltered = table.getState().columnFilters.length > 0;

  const positions = positionOrderArray.map((p) => {
    return {
      label: p,
      value: p,
    };
  });

  const nationalities = Array.from(
    table.getColumn("nationality").getFacetedUniqueValues(),
    (entry) => {
      return {
        label: entry[0]
          .replace("_", " ")
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
          .join(" ")
          .replace("Of", "of")
          .replace("_i", " I"),
        value: entry[0],
        icon: (
          <Image
            src={`https://app.playmfl.com/img/flags/${entry[0]}.svg`}
            alt={entry[0]}
            width={512}
            height={512}
            className="h-5 w-5"
            unoptimized
          />
        ),
      };
    }
  ).sort((a, b) => {
    if (a.value > b.value) {
      return 1;
    }
    if (a.value < b.value) {
      return -1;
    }
    return 0;
  });

  const preferredFoot = Array.from(
    table.getColumn("preferredFoot").getFacetedUniqueValues(),
    (entry) => {
      return {
        label: entry[0]
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
          .join(" "),
        value: entry[0],
      };
    }
  );

  const tags = Array.from(
    table.getColumn("tags").getFacetedUniqueValues(),
    (entry) => {
      return {
        label: entry[0],
        value: entry[0],
      };
    }
  ).sort((a, b) => {
    if (a.value > b.value) {
      return 1;
    }
    if (a.value < b.value) {
      return -1;
    }
    return 0;
  });

  return (
    <>
      <div className="grid md:grid-cols-2 mb-6 gap-4">
        <div className="flex md:order-2 relative z-10 items-center justify-between md:justify-end space-x-3">
          <div className="flex md:flex-row-reverse items-center">
            <FilterOptions
              count={table.getState().columnFilters.length}
              handleClick={() => setShowFilterControls(!showFilterControls)}
            />
            {isFiltered && (
              <button
                onClick={() => table.resetColumnFilters()}
                className="ml-3 md:mr-3 flex items-center justify-center space-x-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-900/60 px-4 py-3 rounded-lg cursor-pointer ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
              >
                <XMarkIcon className="mr-1.5 h-5 w-5" />
                Reset
              </button>
            )}
          </div>
          <ViewOptions table={table} />
        </div>
        <div className="flex md:order-1 flex-1 items-center space-x-2 justify-stretch">
          <DebouncedInput
            value={table.getState().globalFilter ?? ""}
            onChange={(value) => table.setGlobalFilter(String(value))}
            className="block w-full bg-white dark:bg-slate-900 rounded-lg border-0 py-3 px-4 text-slate-900 shadow-2xl shadow-slate-200 dark:shadow-slate-900 dark:text-slate-400 placeholder:text-slate-400 focus:ring-0 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
            placeholder="Search by name or id..."
          />
          <FacetedFilter
            column={table.getColumn("tags")}
            options={tags}
            placeholder="Filter tags..."
            showCount={true}
            showClear={false}
            className="w-60"
          />
        </div>
      </div>
      {showFilterControls && (
        <div className="relative my-8 space-y-4 rounded-lg bg-white dark:bg-slate-950 p-8 text-sm shadow-2xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5">
          <div className="grid grid-cols-12 gap-y-4 gap-x-8">
            <NumberFilter
              column={table.getColumn("overall")}
              label={columnLabels.find((i) => i.id === "overall").label}
              className="col-span-4 lg:hidden"
            />
            <NumberFilter
              column={table.getColumn("age")}
              label={columnLabels.find((i) => i.id === "age").label}
              className="col-span-4"
            />
            <NumberFilter
              column={table.getColumn("height")}
              label={columnLabels.find((i) => i.id === "height").label}
              className="col-span-4"
            />
            <FacetedRadioFilter
              column={table.getColumn("preferredFoot")}
              options={preferredFoot}
              label={columnLabels.find((i) => i.id === "preferredFoot").label}
              className="col-span-6 lg:col-span-4"
            />
            <FacetedFilter
              column={table.getColumn("nationality")}
              label={columnLabels.find((i) => i.id === "nationality").label}
              options={nationalities}
              placeholder="Select nationalities..."
              showCount={true}
              className="col-span-6 lg:col-span-4"
            />
            <FacetedFilter
              column={table.getColumn("position")}
              label={columnLabels.find((i) => i.id === "position").label}
              options={positions}
              placeholder="Select positions..."
              showCount={true}
              className="col-span-6 lg:col-span-4"
            />
            <FacetedFilter
              column={table.getColumn("positions")}
              label={columnLabels.find((i) => i.id === "positions").label}
              options={positions}
              placeholder="Select positions..."
              className="col-span-6 lg:col-span-4"
            />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-7 gap-y-4 gap-x-8">
            <NumberFilter
              column={table.getColumn("overall")}
              label={columnLabels.find((i) => i.id === "overall").label}
              className="hidden lg:block"
            />
            <NumberFilter
              column={table.getColumn("pace")}
              label={columnLabels.find((i) => i.id === "pace").label}
            />
            <NumberFilter
              column={table.getColumn("shooting")}
              label={columnLabels.find((i) => i.id === "shooting").label}
            />
            <NumberFilter
              column={table.getColumn("passing")}
              label={columnLabels.find((i) => i.id === "passing").label}
            />
            <NumberFilter
              column={table.getColumn("dribbling")}
              label={columnLabels.find((i) => i.id === "dribbling").label}
            />
            <NumberFilter
              column={table.getColumn("defense")}
              label={columnLabels.find((i) => i.id === "defense").label}
            />
            <NumberFilter
              column={table.getColumn("physical")}
              label={columnLabels.find((i) => i.id === "physical").label}
            />
          </div>
        </div>
      )}
    </>
  );
}
