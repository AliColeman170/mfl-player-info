import { cn } from "@/utils/helpers";
import { FunnelIcon } from "@heroicons/react/24/solid";

export default function FilterOptions({
  count,
  handleClick,
  className,
}: {
  count: number;
  handleClick: () => void;
  className?: string;
}) {
  return (
    <div className={cn(`relative`, className)}>
      <button
        onClick={() => handleClick()}
        className="flex items-center justify-center space-x-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-900/60 px-4 py-3 rounded-lg ring-1 ring-slate-950 dark:ring-slate-800 ring-opacity-5"
      >
        {<FunnelIcon className="h-5 w-5 text-slate-50" aria-hidden="true" />}
        <span className="text-slate-200">Advanced</span>
      </button>
      {count > 0 && (
        <div className="absolute flex items-center justify-center text-xs font-semibold -top-2 -right-2 rounded-full bg-indigo-500 text-white h-6 w-6">
          {count}
        </div>
      )}
    </div>
  );
}
