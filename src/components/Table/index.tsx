'use client';

import {
  ColumnFiltersState,
  PaginationState,
  Row,
  type SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { columns } from './columns';
import { HeartIcon } from '@heroicons/react/24/solid';
import { Pagination } from './Pagination';
import { Toolbar } from './Toolbar';
import { useLocalStorage } from 'usehooks-ts';
import { PlayerWithFavouriteData } from '@/types/global.types';

export function Table({ players }: { players: PlayerWithFavouriteData[] }) {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  const [globalFilter, setGlobalFilter] = useState<any>('');

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'id',
      desc: false,
    },
  ]);

  const [storeVisibility, setStoreVisibility] =
    useLocalStorage<VisibilityState>('columnVisibility.store', {
      height: false,
      preferredFoot: false,
      pace: false,
      shooting: false,
      passing: false,
      dribbling: false,
      defense: false,
      physical: false,
    });

  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(storeVisibility);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setStoreVisibility(columnVisibility);
  }, [setStoreVisibility, columnVisibility]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  function selectFilter(
    row: Row<PlayerWithFavouriteData>,
    columnId: string,
    value: any
  ) {
    const selectedValues = value;
    const values = new Set(row.getValue(columnId) as string);
    const included = [...selectedValues].every((selectedValue) =>
      values.has(selectedValue)
    );
    return included;
  }

  const table = useReactTable({
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id.toString(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    autoResetPageIndex: false,
    filterFns: {
      select: selectFilter,
    },
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnFilters,
      pagination,
    },
  });

  return (
    <>
      <Toolbar table={table} />
      <div className='h-full w-full overflow-y-hidden overflow-x-scroll pb-4'>
        <table
          className='w-full min-w-[800px] divide-y divide-slate-200 dark:divide-slate-800'
          suppressHydrationWarning
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-1 py-2.5 text-left text-sm font-semibold text-slate-950 dark:text-white ${
                      ['id'].includes(header.id) ? 'w-20' : ''
                    } ${['name'].includes(header.id) ? 'w-40' : ''} ${
                      [
                        'age',
                        'overall',
                        'pace',
                        'shooting',
                        'passing',
                        'dribbling',
                        'defense',
                        'physical',
                      ].includes(header.id)
                        ? 'w-16'
                        : ''
                    } ${
                      ['nationality', 'favourite'].includes(header.id)
                        ? 'w-9 min-w-[36px]'
                        : ''
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="before:-mt-5 before:block before:content-['\200C'] after:-mt-5 after:block after:content-['\200C']">
            {players.length !== 0 ? (
              table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className='h-11 whitespace-nowrap px-2 py-1 text-sm text-slate-700 dark:text-slate-300'
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='h-24 text-center text-slate-700 dark:text-slate-300'
                  >
                    No Results.
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className='h-24 text-center text-slate-700 dark:text-slate-300'
                >
                  <div className='m-24 flex flex-1 flex-col justify-center text-center'>
                    <HeartIcon className='mx-auto h-12 w-12 text-red-500' />
                    <h3 className='mt-2 text-3xl font-semibold text-slate-900 dark:text-white'>
                      No Favourites
                    </h3>
                    <p className='mt-1 text-base text-slate-500 dark:text-slate-400'>
                      Click the heart beside players to add to your favourites.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
      <Pagination table={table} />
    </>
  );
}
