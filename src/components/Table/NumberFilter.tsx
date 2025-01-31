import { cn } from '@/utils/helpers';
import { DebouncedInput } from '../DebouncedInput';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { Column } from '@tanstack/react-table';

export function NumberFilter({
  column,
  label,
  className = '',
}: {
  column: Column<PlayerWithFavouriteData, unknown> | undefined;
  label?: string;
  className?: string;
}) {
  const columnFilterValue = (column?.getFilterValue() as Array<number>) || null;

  return (
    <div className={cn('w-full @container', className)}>
      <label className='block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50'>
        {label}
      </label>
      <div className='mt-1 grid grid-cols-1 gap-2 @[180px]:grid-cols-2'>
        <DebouncedInput
          type='number'
          pattern='[0-9]*'
          inputMode='numeric'
          min={Number(column?.getFacetedMinMaxValues()?.[0] ?? '')}
          max={Number(column?.getFacetedMinMaxValues()?.[1] ?? '')}
          value={columnFilterValue?.[0].toString() ?? ''}
          onChange={(value) =>
            column?.setFilterValue((old: Array<number>) => {
              return [value, old?.[1]];
            })
          }
          placeholder={`Min ${
            column?.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ''
          }`}
          className='block w-full rounded-lg border-0 bg-white px-3 py-3 text-slate-900 shadow-2xl shadow-slate-200 ring-1 ring-slate-900 ring-opacity-5 placeholder:text-slate-400 focus:ring-0 dark:bg-slate-900 dark:text-white dark:shadow-slate-900 dark:ring-slate-800'
        />
        <DebouncedInput
          type='number'
          pattern='[0-9]*'
          inputMode='numeric'
          min={Number(column?.getFacetedMinMaxValues()?.[0] ?? '')}
          max={Number(column?.getFacetedMinMaxValues()?.[1] ?? '')}
          value={columnFilterValue?.[1]?.toString() ?? ''}
          onChange={(value) =>
            column?.setFilterValue((old: Array<number>) => [old?.[0], value])
          }
          placeholder={`Max ${
            column?.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ''
          }`}
          className='block w-full rounded-lg border-0 bg-white px-3 py-3 text-slate-900 shadow-2xl shadow-slate-200 ring-1 ring-slate-900 ring-opacity-5 placeholder:text-slate-400 focus:ring-0 dark:bg-slate-900 dark:text-white dark:shadow-slate-900 dark:ring-slate-800'
        />
      </div>
      <div className='h-1' />
    </div>
  );
}
