import { PlayerWithFavouriteData } from '@/types/global.types';
import { cn } from '@/utils/helpers';
import { Field, Label, Radio, RadioGroup } from '@headlessui/react';
import { Column } from '@tanstack/react-table';
import { useState } from 'react';

export function FacetedRadioFilter({
  column,
  options,
  label = '',
  className = '',
}: {
  column: Column<PlayerWithFavouriteData, unknown>;
  options: { label: string; value: string }[];
  label?: string;
  className?: string;
}) {
  const [value, setValue] = useState(column.getFilterValue() || '');

  return (
    <div className={cn('w-full', className)}>
      <div className='flex items-center justify-between'>
        <h2 className='block text-sm font-semibold leading-6 text-slate-900 dark:text-slate-50'>
          {label}
        </h2>
        <button
          onClick={() => {
            setValue('');
            column?.setFilterValue(undefined);
          }}
          className='text-indigo-500'
        >
          Clear
        </button>
      </div>

      <RadioGroup
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          column?.setFilterValue(newValue);
        }}
        className='mt-1'
      >
        <Label className='sr-only'>Choose a preferred foot</Label>
        <div className='grid grid-cols-2 gap-2'>
          {options.map((option) => (
            <Field key={option.value} className='flex items-center gap-2'>
              <Radio
                value={option.value}
                className={cn(
                  'flex cursor-pointer items-center justify-center rounded-lg border-0 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-2xl shadow-slate-200 ring-1 ring-slate-900 ring-opacity-5 hover:bg-slate-50 focus:outline-none focus:ring-0 sm:flex-1 dark:bg-slate-900 dark:text-slate-100 dark:shadow-slate-900 dark:ring-slate-800 dark:hover:bg-slate-950',
                  'ring-inset data-[checked]:text-slate-950 data-[checked]:ring-2 data-[checked]:ring-indigo-600 hover:data-[checked]:bg-slate-50 dark:data-[checked]:text-white dark:hover:data-[checked]:bg-slate-950',
                  'data-[focus]:ring-1 data-[focus]:ring-indigo-600'
                )}
              >
                <Label as='span'>{option.label}</Label>
              </Radio>
            </Field>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
