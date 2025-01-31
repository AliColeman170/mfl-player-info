'use client';

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import {
  AdjustmentsHorizontalIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/utils/helpers';
import { columnLabels } from './columns';

import { Table } from '@tanstack/react-table';
import { PlayerWithFavouriteData } from '@/types/global.types';

export function ViewOptions({
  table,
  className,
}: {
  table: Table<PlayerWithFavouriteData>;
  className?: string;
}) {
  return (
    <Popover
      as='div'
      className={cn('relative inline-block text-left', className)}
    >
      <div>
        <PopoverButton className='flex cursor-pointer items-center justify-center space-x-2.5 rounded-lg bg-slate-800 px-4 py-3 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-900 dark:bg-slate-900 dark:ring-slate-800 dark:hover:bg-slate-900/60'>
          {
            <AdjustmentsHorizontalIcon
              className='h-5 w-5 text-slate-50'
              aria-hidden='true'
            />
          }
          <span className='text-slate-200'>View</span>
        </PopoverButton>
      </div>
      <PopoverPanel
        anchor={{ to: 'bottom end' }}
        className='relative z-20 mt-1 max-h-60 min-w-[12rem] overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-950 ring-opacity-5 focus:outline-none dark:bg-slate-950 dark:ring-slate-800'
      >
        <div className='py-1'>
          {table
            .getAllColumns()
            .filter(
              (column) =>
                typeof column.accessorFn !== 'undefined' && column.getCanHide()
            )
            .map((column) => {
              return (
                <div key={column.id}>
                  <button
                    onClick={() => {
                      column.toggleVisibility(!column.getIsVisible());
                    }}
                    className={cn(
                      `group flex w-full items-center px-4 py-2 capitalize hover:bg-slate-900 hover:text-white`
                    )}
                  >
                    {column.getIsVisible() ? (
                      <CheckIcon
                        className='mr-3 h-4 w-4 text-slate-400 group-hover:text-slate-200'
                        aria-hidden='true'
                      />
                    ) : (
                      <div className='mr-3 h-4 w-4' />
                    )}
                    {columnLabels.find((i) => i.id === column.id)?.label}
                  </button>
                </div>
              );
            })}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
