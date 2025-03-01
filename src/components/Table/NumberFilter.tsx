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
    <div className={cn('@container w-full', className)}>
      <label htmlFor={label} className='block text-xs/5 font-semibold'>
        {label}
      </label>
      <div className='mt-1 grid grid-cols-1 gap-2 @[180px]:grid-cols-2'>
        <DebouncedInput
          id={label}
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
          className='bg-card outline-border placeholder:text-muted focus:outline-primary block h-10 w-full rounded-lg px-4 py-3 shadow-2xl outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2'
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
          className='bg-card outline-border placeholder:text-muted focus:outline-primary block h-10 w-full rounded-lg px-4 py-3 shadow-2xl outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2'
        />
      </div>
    </div>
  );
}
