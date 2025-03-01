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
import { cn } from '@/utils/helpers';

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
      <div className='h-full w-full overflow-x-scroll overflow-y-hidden pb-4'>
        <table
          className='divide-border w-full min-w-[800px] divide-y'
          suppressHydrationWarning
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'text-muted-foreground px-2 py-2.5',
                      ['id'].includes(header.id) && 'min-w-20',
                      ['nationality', 'favourite'].includes(header.id) &&
                        'min-w-9',
                      ['name'].includes(header.id) && 'w-full',
                      ['height'].includes(header.id) && 'min-w-16',
                      [
                        'overall',
                        'pace',
                        'shooting',
                        'passing',
                        'dribbling',
                        'defense',
                        'physical',
                      ].includes(header.id) && 'w-9 text-center',
                      ['age'].includes(header.id) && 'min-w-15'
                    )}
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
                        className='h-11 px-1.5 py-1 text-sm whitespace-nowrap'
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
                  <td colSpan={columns.length} className='h-24 text-center'>
                    No Results.
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={columns.length} className='h-24 text-center'>
                  <div className='m-24 flex flex-1 flex-col justify-center text-center'>
                    <HeartIcon className='mx-auto size-12 text-red-500' />
                    <h3 className='mt-2 text-3xl font-semibold'>
                      No Favourites
                    </h3>
                    <p className='text-muted mt-1 text-base'>
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
