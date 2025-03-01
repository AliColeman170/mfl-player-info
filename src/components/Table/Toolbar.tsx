'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { ViewOptions } from './ViewOptions';
import { FilterOptions } from './FilterOptions';
import { DebouncedInput } from '../DebouncedInput';
import { positionOrderArray } from '@/utils/helpers';
import { useState } from 'react';
import { NumberFilter } from './NumberFilter';
import { FacetedFilter } from './FacetedFilter';
import { columnLabels } from './columns';
import { FacetedRadioFilter } from './FacetedRadioFilter';
import Image from 'next/image';
import { FavouriteToggle } from './FavouriteToggle';
import { Table } from '@tanstack/react-table';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { Button } from '../UI/Button';

export function Toolbar({ table }: { table: Table<PlayerWithFavouriteData> }) {
  const [showFilterControls, setShowFilterControls] = useState(false);
  const isFiltered = table.getState().columnFilters.length > 0;

  const positions = positionOrderArray.map((p) => {
    return {
      label: p,
      value: p,
    };
  });

  const nationalities = Array.from(
    table.getColumn('nationality')?.getFacetedUniqueValues() || [],
    (entry) => {
      return {
        label: entry[0]
          .replace('_', ' ')
          .toLowerCase()
          .split(' ')
          .map(
            (word: string) => word.charAt(0).toUpperCase() + word.substring(1)
          )
          .join(' ')
          .replace('Of', 'of')
          .replace('_i', ' I'),
        value: entry[0],
        icon: (
          <Image
            src={`https://app.playmfl.com/img/flags/${entry[0]}.svg`}
            alt={entry[0]}
            width={512}
            height={512}
            className='h-5 w-5'
            unoptimized
          />
        ),
      };
    }
  ).sort((a, b) => {
    if (a.value > b.value) {
      return 1;
    }
    if (a.value < b.value) {
      return -1;
    }
    return 0;
  });

  const preferredFoot = Array.from(
    table.getColumn('preferredFoot')?.getFacetedUniqueValues() || [],
    (entry) => {
      return {
        label: entry[0]
          .toLowerCase()
          .split(' ')
          .map(
            (word: string) => word.charAt(0).toUpperCase() + word.substring(1)
          )
          .join(' '),
        value: entry[0],
      };
    }
  );

  const tags = Array.from(
    table.getColumn('tags')?.getFacetedUniqueValues() || [],
    (entry) => {
      return {
        label: entry[0],
        value: entry[0],
      };
    }
  ).sort((a, b) => {
    if (a.value > b.value) {
      return 1;
    }
    if (a.value < b.value) {
      return -1;
    }
    return 0;
  });

  return (
    <>
      <div className='mb-6 grid gap-4 md:grid-cols-2'>
        <div className='relative z-10 flex items-center justify-between gap-x-2 md:order-2 md:justify-end'>
          <div className='flex items-center gap-x-2 md:flex-row-reverse'>
            <FilterOptions
              count={table.getState().columnFilters.length}
              handleClick={() => setShowFilterControls(!showFilterControls)}
            />
            {isFiltered && (
              <Button
                variant='secondary'
                size='lg'
                onClick={() => table.resetColumnFilters()}
              >
                <XMarkIcon />
                Clear All
              </Button>
            )}
          </div>
          <ViewOptions table={table} />
        </div>
        <div className='flex flex-1 items-center justify-stretch gap-x-3 md:order-1'>
          <FavouriteToggle column={table.getColumn('favourite')} />
          <DebouncedInput
            value={table.getState().globalFilter ?? ''}
            onChange={(value) => table.setGlobalFilter(String(value))}
            className='bg-card outline-border focus:outline-primary placeholder:text-muted block h-10 w-full rounded-lg px-4 py-3 text-sm outline-1 -outline-offset-1 focus:ring-0 focus:outline-2 focus:-outline-offset-2'
            placeholder='Search by name or id...'
          />
          <FacetedFilter
            column={table.getColumn('tags')!}
            options={tags}
            placeholder='Filter tags...'
            showCount={true}
            showClear={false}
            className='w-72'
          />
        </div>
      </div>
      {showFilterControls && (
        <div className='bg-popover shadow-foreground/3 ring-border relative my-6 grid gap-y-4 rounded-lg p-6 text-sm shadow-2xl ring-1 sm:p-6'>
          <div className='grid grid-cols-12 gap-x-4 gap-y-4 sm:gap-x-6 md:gap-x-8'>
            <NumberFilter
              column={table.getColumn('overall')}
              label={columnLabels.find((i) => i.id === 'overall')?.label}
              className='col-span-4 lg:hidden'
            />
            <NumberFilter
              column={table.getColumn('age')}
              label={columnLabels.find((i) => i.id === 'age')?.label}
              className='col-span-4'
            />
            <NumberFilter
              column={table.getColumn('height')}
              label={columnLabels.find((i) => i.id === 'height')?.label}
              className='col-span-4'
            />
            <FacetedRadioFilter
              column={table.getColumn('preferredFoot')!}
              options={preferredFoot}
              label={columnLabels.find((i) => i.id === 'preferredFoot')?.label}
              className='col-span-6 lg:col-span-4'
            />
            <FacetedFilter
              column={table.getColumn('nationality')!}
              label={columnLabels.find((i) => i.id === 'nationality')?.label}
              options={nationalities}
              placeholder='Select nationalities...'
              showCount={true}
              className='col-span-6 lg:col-span-4'
            />
            <FacetedFilter
              column={table.getColumn('position')!}
              label={columnLabels.find((i) => i.id === 'position')?.label}
              options={positions}
              placeholder='Select positions...'
              showCount={true}
              className='col-span-6 lg:col-span-4'
            />
            <FacetedFilter
              column={table.getColumn('positions')!}
              label={columnLabels.find((i) => i.id === 'positions')?.label}
              options={positions}
              placeholder='Select positions...'
              className='col-span-6 lg:col-span-4'
            />
          </div>
          <div className='grid grid-cols-3 gap-x-8 gap-y-4 md:grid-cols-6 lg:grid-cols-7'>
            <NumberFilter
              column={table.getColumn('overall')}
              label={columnLabels.find((i) => i.id === 'overall')?.label}
              className='hidden lg:block'
            />
            <NumberFilter
              column={table.getColumn('pace')}
              label={columnLabels.find((i) => i.id === 'pace')?.label}
            />
            <NumberFilter
              column={table.getColumn('shooting')}
              label={columnLabels.find((i) => i.id === 'shooting')?.label}
            />
            <NumberFilter
              column={table.getColumn('passing')}
              label={columnLabels.find((i) => i.id === 'passing')?.label}
            />
            <NumberFilter
              column={table.getColumn('dribbling')}
              label={columnLabels.find((i) => i.id === 'dribbling')?.label}
            />
            <NumberFilter
              column={table.getColumn('defense')}
              label={columnLabels.find((i) => i.id === 'defense')?.label}
            />
            <NumberFilter
              column={table.getColumn('physical')}
              label={columnLabels.find((i) => i.id === 'physical')?.label}
            />
          </div>
        </div>
      )}
    </>
  );
}
