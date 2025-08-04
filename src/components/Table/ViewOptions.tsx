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
import { Button } from '../UI/button-alt';

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
        <PopoverButton as={Button} size='lg'>
          <AdjustmentsHorizontalIcon className='size-5' aria-hidden='true' />
          View
        </PopoverButton>
      </div>
      <PopoverPanel
        anchor={{ to: 'bottom end' }}
        className='bg-popover ring-border relative z-20 mt-1 max-h-60 min-w-[12rem] overflow-auto rounded-lg py-1 text-sm shadow-lg ring-1 focus:outline-hidden'
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
                      `group hover:bg-accent flex w-full items-center px-4 py-2 capitalize`
                    )}
                  >
                    {column.getIsVisible() ? (
                      <CheckIcon
                        className='text-primary mr-3 size-4 stroke-2'
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
