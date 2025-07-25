'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import { columns } from './columns';
import { HeartIcon } from '@heroicons/react/24/solid';
import { Toolbar } from './Toolbar';
import { useLocalStorage } from 'usehooks-ts';
import { PlayerWithFavouriteData } from '@/types/global.types';
import { cn } from '@/utils/helpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table';

interface VirtualizedTableProps {
  players: PlayerWithFavouriteData[];
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
}

export function VirtualizedTable({
  players,
  onLoadMore,
  hasNextPage = false,
  isLoading = false,
}: VirtualizedTableProps) {
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

  function selectFilter(row: any, columnId: string, value: any) {
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
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    filterFns: {
      select: selectFilter,
    },
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnFilters,
    },
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [hasScrolledNearEnd, setHasScrolledNearEnd] = useState(false);

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Handle scroll events to detect when user scrolls near the end
  useEffect(() => {
    const scrollElement = tableContainerRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Set flag when scrolled to 80% of the content
      setHasScrolledNearEnd(scrollPercentage > 0.8);
    };

    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, []);

  // Load more data when user has scrolled near the end
  useEffect(() => {
    if (
      hasNextPage &&
      !isLoading &&
      onLoadMore &&
      hasScrolledNearEnd &&
      virtualRows.length > 0 &&
      rows.length > 0
    ) {
      const lastItem = virtualRows[virtualRows.length - 1];
      // Only load more if we're showing the last few rows
      if (lastItem && lastItem.index >= rows.length - 5) {
        onLoadMore();
        setHasScrolledNearEnd(false); // Reset flag to prevent multiple calls
      }
    }
  }, [
    virtualRows,
    rows.length,
    hasNextPage,
    isLoading,
    onLoadMore,
    hasScrolledNearEnd,
  ]);

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() -
        (virtualRows[virtualRows.length - 1]?.end || 0)
      : 0;

  if (players.length === 0 && !isLoading) {
    return (
      <div className='h-full w-full'>
        <Toolbar table={table} />
        <div className='flex flex-1 flex-col items-center justify-center py-12'>
          <HeartIcon className='mx-auto size-12 text-red-500' />
          <h3 className='mt-2 text-3xl font-semibold'>No Players Found</h3>
          <p className='text-muted-foreground mt-1 text-base'>
            No players match your current filters.
          </p>
        </div>
      </div>
    );
  }

  if (players.length === 0 && isLoading) {
    return (
      <div className='h-full w-full'>
        <Toolbar table={table} />
        <div className='flex flex-1 flex-col items-center justify-center py-12'>
          <div className='border-primary mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <h3 className='mt-2 text-lg font-semibold'>Loading Players...</h3>
          <p className='text-muted-foreground mt-1 text-base'>
            Fetching player data from the server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full w-full flex flex-col'>
      <Toolbar table={table} />

      <div className='flex-1 border border-border rounded-md overflow-hidden'>
        <div className='bg-background border-b border-border sticky top-0 z-10'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
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
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          </Table>
        </div>

        <div
          ref={tableContainerRef}
          className='h-full overflow-auto'
          style={{ height: 'calc(100% - 57px)' }}
        >
          <Table>
            <TableBody>
              <tr style={{ height: `${paddingTop}px` }} />
              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;

                return (
                  <TableRow
                    key={row.id}
                    ref={(node) => rowVirtualizer.measureElement(node)}
                    className='border-border border-b'
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start - paddingTop}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className='h-11 px-1.5 py-1 text-sm whitespace-nowrap'
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              <tr style={{ height: `${paddingBottom}px` }} />
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleLeafColumns().length}
                    className='h-12 text-center'
                  >
                    <div className='flex items-center justify-center'>
                      <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2'></div>
                      <span className='ml-2'>Loading more players...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {hasNextPage && (
        <div className='flex items-center justify-center px-2 py-4'>
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className='bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 disabled:opacity-50'
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
