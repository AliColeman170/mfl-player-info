import { cn } from "@/utils/helpers";
import { RadioGroup } from "@headlessui/react";
import { useState } from "react";

export default function FacetedRadioFilter({
  column,
  options,
  label = "",
  className = "",
}) {
  const [value, setValue] = useState(column.getFilterValue() || "");

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        <h2 className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
          {label}
        </h2>
        <button
          onClick={() => {
            setValue("");
            column?.setFilterValue(undefined);
          }}
          className="text-indigo-500"
        >
          Clear
        </button>
      </div>

      <RadioGroup
        value={value}
        onChange={(value) => {
          setValue(value);
          column?.setFilterValue(value);
        }}
        className="mt-1"
      >
        <RadioGroup.Label className="sr-only">
          Choose a preferred foot
        </RadioGroup.Label>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <RadioGroup.Option
              key={option.value}
              value={option.value}
              className={({ active, checked }) =>
                cn(
                  active ? "ring-1 ring-indigo-600" : "",
                  checked
                    ? "bg-slate-100 dark:bg-slate-950 text-slate-950 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-950 ring-1 ring-slate-200 dark:ring-indigo-800"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg border-0 py-3 px-4 text-slate-900 dark:text-slate-100 focus:ring-0 shadow-2xl shadow-slate-200 dark:shadow-slate-900 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5",
                  "flex items-center justify-center rounded-md py-3 px-3 text-sm font-semibold sm:flex-1 cursor-pointer focus:outline-none"
                )
              }
            >
              <RadioGroup.Label as="span">{option.label}</RadioGroup.Label>
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
