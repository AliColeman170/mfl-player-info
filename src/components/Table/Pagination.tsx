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

export function Pagination({
  table,
}: {
  table: Table<PlayerWithFavouriteData>;
}) {
  return (
    <div className='flex w-full items-center justify-between px-2 py-2'>
      <div className='flex items-center space-x-2'>
        <p className='text-sm font-medium'>Show</p>
        <Listbox
          value={`${table.getState().pagination.pageSize}`}
          onChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <div className='relative'>
            <ListboxButton className='relative flex w-16 cursor-pointer items-center justify-center space-x-1.5 rounded-lg bg-slate-100 py-1.5 pl-3 pr-8 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/70'>
              <span className='block truncate'>
                {table.getState().pagination.pageSize}
              </span>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <ChevronUpDownIcon
                  className='h-5 w-5 text-slate-700 dark:text-slate-300'
                  aria-hidden='true'
                />
              </span>
            </ListboxButton>
            <ListboxOptions
              anchor='bottom'
              className='mt-1 max-h-60 w-16 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-950 ring-opacity-5 focus:outline-none dark:bg-slate-950 dark:ring-slate-800'
            >
              {[20, 40, 60, 80, 100].map((pageSize) => (
                <ListboxOption
                  key={pageSize}
                  value={`${pageSize}`}
                  className={({ active }) =>
                    cn(
                      active
                        ? 'bg-slate-100 dark:bg-slate-900 dark:text-white'
                        : 'text-slate-900 dark:text-slate-50',
                      'relative cursor-default select-none py-2 pl-3 pr-9'
                    )
                  }
                >
                  {pageSize}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
      <div className='flex items-center space-x-2 lg:space-x-4'>
        <div className='w-[100px] text-right text-sm font-medium'>
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()}
        </div>
        <div className='flex items-center space-x-2'>
          <button
            className='justify-centertext-sm relative hidden cursor-pointer items-center rounded-lg bg-slate-100 px-2 py-1.5 font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 lg:flex dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/70'
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to first page</span>
            <ChevronDoubleLeftIcon className='h-4 w-4' />
          </button>
          <button
            className='relativeflex cursor-pointer items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/70'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className='sr-only'>Go to previous page</span>
            <ChevronLeftIcon className='h-4 w-4' />
          </button>
          <button
            className='relative flex cursor-pointer items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/70'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to next page</span>
            <ChevronRightIcon className='h-4 w-4' />
          </button>
          <button
            className='relative hidden cursor-pointer items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-sm font-medium ring-1 ring-slate-950 ring-opacity-5 hover:bg-slate-200 lg:flex dark:bg-slate-800 dark:ring-slate-800 dark:hover:bg-slate-800/70'
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className='sr-only'>Go to last page</span>
            <ChevronDoubleRightIcon className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
