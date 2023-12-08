import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import SpinnerIcon from "../SpinnerIcon";
import { useEffect, useRef } from "react";

export function SearchInput({
  placeholder = "Player ID...",
  value,
  handleSearch,
  isLoading = false,
  autoFocus = false,
}: {
  placeholder?: string;
  value: string;
  handleSearch: (e) => void;
  isLoading?: boolean;
  autoFocus?: boolean;
}) {
  const innerRef = useRef<HTMLInputElement>();
  useEffect(() => {
    if (innerRef.current && autoFocus) {
      innerRef.current.focus();
      var val = innerRef.current.value;
      innerRef.current.value = "";
      innerRef.current.value = val;
    }
  });
  return (
    <div className="mx-auto w-full divide-y divide-slate-100 overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl shadow-slate-300 dark:shadow-slate-900 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 sm:top-4 h-6 w-6 sm:h-8 sm:w-8 text-slate-400 dark:text-slate-600" />
        <input
          ref={innerRef}
          type="number"
          step={1}
          min={1}
          className="h-12 sm:h-16 text-lg sm:text-xl w-full border-0 bg-transparent pl-12 sm:pl-16 pr-4 text-slate-900 dark:text-slate-400 placeholder:text-slate-400 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder={placeholder}
          defaultValue={value}
          onChange={handleSearch}
          pattern="[0-9]*"
          inputMode="numeric"
        />
        {isLoading && (
          <SpinnerIcon className="animate-spin absolute right-5 top-4 sm:top-5 h-6 w-6 text-slate-400" />
        )}
      </div>
    </div>
  );
}
