import { Combobox } from "@headlessui/react";
import Image from "next/image";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import SpinnerIcon from "../SpinnerIcon";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { MFLPlayer } from "@/types/global";
import { cn, isPositiveInteger } from "@/utils/helpers";

export function SearchComboBox({
  id,
  isLoading,
  handlePlayerChange,
  placeholder = "Search player name or ID...",
  autofocus = false,
}: {
  id?: string;
  isLoading?: boolean;
  handlePlayerChange: (id: string | number) => void;
  placeholder?: string;
  autofocus?: boolean;
}) {
  let [query, setQuery] = useDebounceValue("", 800);
  let [filteredOptions, setFilteredOptions] = useState<MFLPlayer[] | null>(
    null
  );
  let [selectedPlayer, setSelectedPlayer] = useState<MFLPlayer | null>(null);
  let [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    async function fetchSearchResults() {
      setIsSearching(true);
      if (isPositiveInteger(query)) {
        setFilteredOptions(null);
        handlePlayerChange(query);
      } else {
        if (query.length >= 3) {
          const result: MFLPlayer[] = await fetch(
            `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?limit=10&sorts=metadata.overall&sortsOrders=DESC&name=${query}&excludingMflOwned=false`
          ).then((res) => res.json());
          setFilteredOptions(result);
        }
      }
      setIsSearching(false);
    }
    if (query !== "") {
      fetchSearchResults();
    }
  }, [query]);

  useEffect(() => {
    if (selectedPlayer) {
      handlePlayerChange(selectedPlayer.id);
    }
  }, [selectedPlayer]);

  return (
    <Combobox
      value={selectedPlayer}
      onChange={(option) => {
        setQuery("");
        setSelectedPlayer(option);
      }}
      as="div"
    >
      <div className="mx-auto w-full divide-y divide-slate-100 overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 sm:left-4 sm:top-4 h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-600" />
          <Combobox.Input
            defaultValue={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-12 sm:h-16 text-lg sm:text-xl w-full border-0 bg-transparent pl-12 sm:pl-16 pr-4 text-slate-900 dark:text-slate-400 placeholder:text-slate-400 focus:ring-0"
            displayValue={() => {
              if (selectedPlayer) return `${selectedPlayer.id}`;
              if (id) return id;
              return null;
            }}
            autoFocus={autofocus}
          />
          {(isSearching || isLoading) && (
            <SpinnerIcon className="animate-spin absolute right-4 sm:right-5 top-3 sm:top-5 h-6 w-6 text-slate-400" />
          )}
        </div>
      </div>

      {filteredOptions && (
        <Combobox.Options className="absolute z-20 mt-2 w-full max-h-60 overflow-auto rounded-lg bg-white dark:bg-slate-950 py-1 text-base shadow-xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5 focus:outline-none">
          {filteredOptions.length === 0 &&
          query !== "" &&
          !isPositiveInteger(query) ? (
            <div className="relative cursor-default select-none py-5 pl-6 pr-9 text-slate-900 dark:text-slate-50">
              No players found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <Combobox.Option
                key={option.id}
                value={option}
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
                      <Image
                        className="w-8"
                        src={`https://d13e14gtps4iwl.cloudfront.net/players/${option.id}/card_512.png`}
                        alt={`Player ${option.id}`}
                        width="512"
                        height="748"
                        unoptimized
                        priority
                      />
                      <div
                        className={cn(
                          "block truncate",
                          selected ? "font-semibold" : "font-normal"
                        )}
                      >
                        {`${option.metadata.firstName} ${option.metadata.lastName}`}
                      </div>
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
            ))
          )}
        </Combobox.Options>
      )}
    </Combobox>
  );
}
