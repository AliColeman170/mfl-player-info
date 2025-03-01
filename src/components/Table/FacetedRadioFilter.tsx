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
        <h2 className='block text-xs/5 font-semibold'>{label}</h2>
        <button
          onClick={() => {
            setValue('');
            column?.setFilterValue(undefined);
          }}
          className='text-primary text-sm'
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
                  'bg-card hover:bg-accent text-foreground/80 focus:outline-primary outline-border flex cursor-pointer items-center justify-center rounded-lg border-0 px-4 py-3 text-sm font-medium outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:flex-1',
                  'data-checked:text-foreground data-checked:outline-primary hover:data-checked:bg-accent data-checked:outline-2 data-checked:-outline-offset-2',
                  'data-focus:outline-primary data-focus:outline-2 data-focus:-outline-offset-2'
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
