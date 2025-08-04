import { cn } from '@/utils/helpers';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/solid';
import { Table } from '@tanstack/react-table';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { Button } from '../UI/button';

export function Pagination({
  table,
}: {
  table: Table<PlayerWithFavouriteData>;
}) {
  return (
    <div className='flex w-full items-center justify-between p-2'>
      <div className='flex items-center gap-x-2'>
        <p className='text-sm font-medium'>Show</p>
        <Listbox
          value={`${table.getState().pagination.pageSize}`}
          onChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <div className='relative'>
            <ListboxButton className='bg-card outline-border relative flex h-8 w-20 cursor-pointer items-center gap-x-1.5 rounded-lg py-1.5 pr-8 pl-3 text-sm font-medium outline-1 -outline-offset-1'>
              <span className='block truncate'>
                {table.getState().pagination.pageSize}
              </span>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ChevronUpDownIcon className='size-5' aria-hidden='true' />
              </span>
            </ListboxButton>
            <ListboxOptions
              anchor='bottom'
              className='bg-popover ring-border mt-1 max-h-60 w-20 overflow-auto rounded-lg py-1 text-sm shadow-lg ring-1 focus:outline-hidden'
            >
              {[20, 40, 60, 80, 100].map((pageSize) => (
                <ListboxOption
                  key={pageSize}
                  value={`${pageSize}`}
                  className='data-active:bg-accent relative cursor-default py-2 pr-9 pl-3 select-none'
                >
                  {pageSize}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
      <div className='flex items-center gap-x-2 lg:gap-x-4'>
        <div className='w-[100px] text-right text-sm font-medium'>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <div className='flex items-center gap-x-1'>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to first page</span>
            <ChevronDoubleLeftIcon />
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            variant='secondary'
            size='sm'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to last page</span>
            <ChevronDoubleRightIcon className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
