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
import { CheckIcon } from '@heroicons/react/20/solid';

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
            <Label htmlFor={label} className='block text-xs/5 font-semibold'>
              {label}
            </Label>
          )}
          {showClear && (
            <button
              onClick={() => column?.setFilterValue(undefined)}
              className='text-primary text-sm'
            >
              Clear
            </button>
          )}
        </div>

        <div className={cn(`relative`, label && 'mt-1')}>
          <div className='bg-card outline-border focus-within:outline-primary relative flex flex-row overflow-hidden rounded-lg outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2'>
            <ComboboxInput
              id={label}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedValues.length
                  ? `${selectedValues.length} Selected`
                  : placeholder
              }
              className={cn(
                'placeholder:text-muted block h-10 w-full rounded-lg px-4 py-3 text-sm outline-none',
                selectedValues.length && 'placeholder:text-foreground'
              )}
            />
            <ComboboxButton className='border-border cursor-default border-l px-1 focus:outline-hidden'>
              <span className='pointer-events-none flex items-center px-2'>
                <ChevronDownIcon className='size-5' />
              </span>
            </ComboboxButton>
          </div>

          <ComboboxOptions
            anchor={{ to: 'bottom start', gap: 8 }}
            className='bg-popover shadow-foreground/3 ring-border relative max-h-60 w-[calc(var(--input-width)_+_var(--button-width))] overflow-auto rounded-lg py-1 text-sm shadow-xl ring-1 focus:outline-hidden'
          >
            {filteredOptions?.map((option) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className={cn(
                  'group relative cursor-default py-2 pr-9 pl-4 select-none focus:outline-hidden',
                  'data-focus:bg-accent'
                )}
              >
                {({ selected }) => (
                  <div className='flex items-center gap-x-3'>
                    {option.icon && option.icon}
                    <div
                      className={cn(
                        'block truncate font-normal',
                        'group-data-selected:font-semibold'
                      )}
                    >
                      {`${option.label} ${showCount && `(${facets?.get(option.value)})`}`}
                    </div>
                    {selected && (
                      <span
                        className={cn(
                          'text-primary absolute inset-y-0 right-0 flex items-center pr-4'
                        )}
                      >
                        <CheckIcon className='size-5' />
                      </span>
                    )}
                  </div>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}
