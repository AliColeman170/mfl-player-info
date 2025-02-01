import { cn } from '@/utils/helpers';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
} from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { ReactNode, useState } from 'react';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { Column } from '@tanstack/react-table';

export function FacetedFilter({
  column,
  label,
  options,
  placeholder = 'Select...',
  showCount = false,
  showClear = true,
  className = '',
}: {
  column: Column<PlayerWithFavouriteData, unknown>;
  label?: string;
  options?: Array<{ label: string; value: string; icon?: ReactNode }>;
  placeholder?: string;
  showClear?: boolean;
  showCount?: boolean;
  className?: string;
}) {
  const facets = column.getFacetedUniqueValues();

  const selectedValues: string[] = Array.isArray(column.getFilterValue())
    ? (column.getFilterValue() as string[])
    : [];

  let [query, setQuery] = useState('');

  const filteredOptions =
    query === ''
      ? options
      : options?.filter((option) => {
          return option.value.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <div className={cn('relative w-full', className)}>
      <Combobox
        value={selectedValues}
        onChange={(option) => {
          setQuery('');
          if (option.length) {
            column?.setFilterValue(option);
          } else {
            column?.setFilterValue(undefined);
          }
        }}
        multiple
        as='div'
      >
        <div className='flex items-center justify-between'>
          {label && (
            <Label className='block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50'>
              {label}
            </Label>
          )}
          {showClear && (
            <button
              onClick={() => column?.setFilterValue(undefined)}
              className='text-indigo-500'
            >
              Clear
            </button>
          )}
        </div>

        <div className={cn(`relative`, label && 'mt-1')}>
          <div className='relative flex flex-row overflow-hidden rounded-lg bg-white shadow-2xl shadow-slate-200 ring-1 ring-slate-900 ring-opacity-5 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800'>
            <ComboboxInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedValues.length
                  ? `${selectedValues.length} Selected`
                  : placeholder
              }
              className='block w-full rounded-lg border-0 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:bg-slate-900 dark:text-white'
            />
            <ComboboxButton className='cursor-default border-l border-slate-100 px-1 focus:outline-none dark:border-slate-800'>
              <span className='pointer-events-none flex items-center px-2'>
                <ChevronDownIcon className='h-5 w-5' />
              </span>
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor={{ to: 'bottom start', gap: 8 }}
            className='relative max-h-60 w-[calc(var(--input-width)_+_var(--button-width))] overflow-auto rounded-lg bg-white py-1 text-sm shadow-xl shadow-slate-200 ring-1 ring-slate-950 ring-opacity-5 focus:outline-none dark:bg-slate-950 dark:shadow-slate-900 dark:ring-slate-800'
          >
            {filteredOptions?.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className={cn(
                  'group relative cursor-default select-none py-2 pl-4 pr-9 text-slate-900 focus:outline-none dark:text-slate-50',
                  'data-[focus]:bg-slate-50 data-[focus]:text-slate-950 dark:data-[focus]:bg-slate-900 dark:data-[focus]:text-white'
                )}
              >
                {({ selected }) => (
                  <>
                    <div className='flex items-center space-x-3'>
                      {option.icon && option.icon}
                      <div
                        className={cn(
                          'block truncate font-normal',
                          'group-data-[selected]:font-semibold'
                        )}
                      >
                        {option.label}
                      </div>
                      {showCount && facets?.get(option.value) && (
                        <span className='ml-auto flex h-4 w-4 items-center justify-center'>
                          ({facets.get(option.value)})
                        </span>
                      )}
                    </div>
                    {selected && (
                      <span
                        className={cn(
                          'absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-500 dark:text-slate-100',
                          'group-data-[focus]:text-indigo-600 dark:group-data-[focus]:text-white'
                        )}
                      >
                        <svg
                          className='h-5 w-5'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </span>
                    )}
                  </>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
