import { cn } from '@/utils/helpers';
import { FunnelIcon } from '@heroicons/react/24/solid';

export function FilterOptions({
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
        className='flex items-center justify-center space-x-2.5 rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-900 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-900/60'
      >
        {<FunnelIcon className='h-5 w-5 text-slate-50' aria-hidden='true' />}
        <span className='text-slate-200'>Advanced</span>
      </button>
      {count > 0 && (
        <div className='absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-semibold text-white'>
          {count}
        </div>
      )}
    </div>
  );
}
