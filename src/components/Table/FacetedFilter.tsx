import { cn } from "@/utils/helpers";
import { Combobox } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ReactNode, useState } from "react";
import { Portal } from "../Portal";
import { usePopper } from "./usePopper";

export function FacetedFilter({
  column,
  label,
  options,
  placeholder = "Select...",
  showCount = false,
  showClear = true,
  className = "",
}: {
  column;
  label?: string;
  options?: Array<{ label: string; value: string; icon?: ReactNode }>;
  placeholder?: string;
  showClear?: boolean;
  showCount?: boolean;
  className?: string;
}) {
  let [trigger, container] = usePopper({
    placement: "bottom-end",
    strategy: "fixed",
    modifiers: [{ name: "offset", options: { offset: [0, 10] } }],
  });
  const facets = column?.getFacetedUniqueValues();

  const selectedValues: Array<string> = column?.getFilterValue() || [];

  let [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return option.value.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className={cn("w-full relative", className)}>
      <Combobox
        value={selectedValues}
        onChange={(option) => {
          setQuery("");
          column?.setFilterValue(option.length ? option : []);
        }}
        multiple
        as="div"
      >
        <div className="flex items-center justify-between">
          {label && (
            <Combobox.Label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
              {label}
            </Combobox.Label>
          )}
          {showClear && (
            <button
              onClick={() =>
                column?.setFilterValue(Array.isArray(selectedValues) ? [] : "")
              }
              className="text-indigo-500"
            >
              Clear
            </button>
          )}
        </div>

        <div className={cn(`relative`, label && "mt-1")}>
          <div className="relative flex flex-row overflow-hidden rounded-lg bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5">
            <Combobox.Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedValues.length
                  ? `${selectedValues.length} Selected`
                  : placeholder
              }
              className="block w-full bg-white dark:bg-slate-900 rounded-lg border-0 py-3 px-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0"
            />
            <Combobox.Button
              ref={trigger}
              className="cursor-default border-l border-slate-100 dark:border-slate-800 px-1 focus:outline-none"
            >
              <span className="pointer-events-none flex items-center px-2">
                <ChevronDownIcon className="h-5 w-5" />
              </span>
            </Combobox.Button>
          </div>

          <Portal>
            <div
              ref={container}
              className="absolute z-20 w-auto rounded-md shadow-lg"
            >
              <Combobox.Options className="relative w-full max-h-60 overflow-auto rounded-lg bg-white dark:bg-slate-950 py-1 text-sm shadow-xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 focus:outline-none">
                {filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active }) => {
                      return cn(
                        "relative cursor-default select-none py-2 pl-4 pr-9 focus:outline-none",
                        active
                          ? "bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white"
                          : "text-slate-900 dark:text-slate-50"
                      );
                    }}
                  >
                    {({ active, selected }) => (
                      <>
                        <div className="flex items-center space-x-3">
                          {option.icon && option.icon}
                          <div
                            className={cn(
                              "block truncate",
                              selected ? "font-semibold" : "font-normal"
                            )}
                          >
                            {option.label}
                          </div>
                          {showCount && facets?.get(option.value) && (
                            <span className="ml-auto flex h-4 w-4 items-center justify-center">
                              ({facets.get(option.value)})
                            </span>
                          )}
                        </div>
                        {selected && (
                          <span
                            className={cn(
                              "absolute inset-y-0 right-0 flex items-center pr-4",
                              active
                                ? "text-indigo-600 dark:text-white"
                                : "text-indigo-500 dark:text-slate-100"
                            )}
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Portal>
        </div>
      </Combobox>
    </div>
  );
}
