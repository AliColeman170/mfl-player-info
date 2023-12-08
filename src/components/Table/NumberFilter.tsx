import { cn } from "@/utils/helpers";
import { DebouncedInput } from "../DebouncedInput";

export function NumberFilter({ column, label, className = "" }) {
  const columnFilterValue = column.getFilterValue();

  return (
    <div className={cn("@container w-full", className)}>
      <label className="block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50">
        {label}
      </label>
      <div className="grid grid-cols-1 @[180px]:grid-cols-2 gap-2 mt-1">
        <DebouncedInput
          type="number"
          pattern="[0-9]*"
          inputMode="numeric"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={columnFilterValue?.[0] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old) => [value, old?.[1]])
          }
          placeholder={`Min ${
            column.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ""
          }`}
          className="block w-full bg-white dark:bg-slate-900 rounded-lg border-0 py-3 px-3 text-slate-900 shadow-2xl shadow-slate-200 dark:shadow-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5"
        />
        <DebouncedInput
          type="number"
          pattern="[0-9]*"
          inputMode="numeric"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? "")}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? "")}
          value={columnFilterValue?.[1] ?? ""}
          onChange={(value) =>
            column.setFilterValue((old) => [old?.[0], value])
          }
          placeholder={`Max ${
            column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ""
          }`}
          className="block w-full bg-white dark:bg-slate-900 rounded-lg border-0 py-3 px-3 text-slate-900 shadow-2xl shadow-slate-200 dark:shadow-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 ring-1 ring-slate-900 dark:ring-slate-800 ring-opacity-5"
        />
      </div>
      <div className="h-1" />
    </div>
  );
}
