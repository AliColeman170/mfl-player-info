'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  VisibilityState,
  OnChangeFn,
} from '@tanstack/react-table';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/UI/table';
import { cn } from '@/utils/helpers';
import { PlayerWithFavouriteData } from '../../types';
import { columns, columnConfig } from './columns';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { usePlayerFilters } from '../../hooks/usePlayerFilters';

interface InfinitePlayersTableProps {
  players: PlayerWithFavouriteData[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  className?: string;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  onTableReady?: (tableControls: {
    toggleColumn: (columnId: string) => void;
    showAllColumns: () => void;
    hideAllColumns: () => void;
    resetColumns: () => void;
    getCurrentVisibility: () => VisibilityState;
  }) => void;
}

export function InfinitePlayersTable({
  players,
  isLoading = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onLoadMore,
  className,
  columnVisibility,
  onColumnVisibilityChange,
  onTableReady,
}: InfinitePlayersTableProps) {
  const { filters, updateSorting } = usePlayerFilters();
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  
  // Track when filters change to reset scroll position (but don't force re-mount)
  const filtersRef = useRef(filters);
  const filtersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current);
  
  useEffect(() => {
    if (filtersChanged) {
      filtersRef.current = filters;
      
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
        tableContainerRef.current.scrollLeft = 0;
        scrollPositionRef.current = 0;
      }
    }
  }, [filters, filtersChanged]);

  // Convert URL sorting state to table sorting state
  const sorting: SortingState = useMemo(
    () =>
      filters.sortBy && filters.sortOrder
        ? [{ id: filters.sortBy, desc: filters.sortOrder === 'desc' }]
        : [],
    [filters.sortBy, filters.sortOrder]
  );

  // Create a ref to hold the sorting state, preventing the callback from re-creating
  const sortingRef = useRef(sorting);
  sortingRef.current = sorting;

  // Handle sorting changes
  const handleSortingChange = useCallback(
    (updater: any) => {
      // Save current horizontal scroll position before sorting
      if (tableContainerRef.current) {
        scrollPositionRef.current = tableContainerRef.current.scrollLeft;
      }

      const newSorting =
        typeof updater === 'function' ? updater(sortingRef.current) : updater;

      if (newSorting.length === 0) {
        // Clear sorting
        updateSorting('', null);
      } else {
        // Update sorting
        const { id, desc } = newSorting[0];
        updateSorting(id, desc ? 'desc' : 'asc');
      }
    },
    [updateSorting]
  );

  // Use external state if provided, otherwise manage internal state
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>(() => {
    if (columnVisibility) {
      return columnVisibility;
    }
    return columnConfig.defaultVisible.reduce((acc, col) => {
      acc[col] = true;
      return acc;
    }, {} as VisibilityState);
  });

  // Sync internal state with external state when it changes
  useEffect(() => {
    if (columnVisibility) {
      setInternalColumnVisibility(columnVisibility);
    }
  }, [columnVisibility]);

  const handleVisibilityChange: OnChangeFn<VisibilityState> = useCallback(
    (updater) => {
      const currentState = columnVisibility || internalColumnVisibility;
      const newState = typeof updater === 'function' 
        ? updater(currentState) 
        : updater;
      
      // Update internal state
      setInternalColumnVisibility(newState);
      
      // Notify external handler if provided
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(updater);
      }
    },
    [columnVisibility, internalColumnVisibility, onColumnVisibilityChange]
  );

  // React Table setup
  const table = useReactTable({
    data: players,
    columns: useMemo(() => columns as ColumnDef<PlayerWithFavouriteData>[], []),
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleVisibilityChange,
    state: {
      sorting,
      columnVisibility: internalColumnVisibility,
    },
    getRowId: useCallback(
      (row: PlayerWithFavouriteData) => row.id.toString(),
      []
    ),
    manualSorting: true, // We handle sorting via API
    enableSortingRemoval: true, // Allow cycling back to no sorting
  });

  // Expose table controls to parent
  useEffect(() => {
    if (onTableReady) {
      const tableControls = {
        toggleColumn: (columnId: string) => {
          table.getColumn(columnId)?.toggleVisibility();
        },
        showAllColumns: () => {
          // Create a new state with all columns visible
          const allColumns = table.getAllColumns();
          const newVisibility: VisibilityState = {};
          allColumns.forEach(column => {
            newVisibility[column.id] = true;
          });
          
          // Use the table's direct method
          table.setColumnVisibility(newVisibility);
        },
        hideAllColumns: () => {
          // Create a new state with only always visible columns showing
          const allColumns = table.getAllColumns();
          const newVisibility: VisibilityState = {};
          allColumns.forEach(column => {
            newVisibility[column.id] = columnConfig.alwaysVisible.includes(column.id);
          });
          
          table.setColumnVisibility(newVisibility);
        },
        resetColumns: () => {
          // Create a new state based on default visibility
          const allColumns = table.getAllColumns();
          const newVisibility: VisibilityState = {};
          allColumns.forEach(column => {
            newVisibility[column.id] = columnConfig.defaultVisible.includes(column.id);
          });
          
          table.setColumnVisibility(newVisibility);
        },
        getCurrentVisibility: () => {
          return table.getState().columnVisibility;
        },
      };
      onTableReady(tableControls);
    }
  }, [table, onTableReady]);


  const { rows } = table.getRowModel();

  // Virtualization setup - reset when data source changes
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: useCallback(() => tableContainerRef.current, []),
    estimateSize: useCallback(() => 42, []),
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Restore horizontal scroll position after data loads
  useLayoutEffect(() => {
    if (
      !isLoading &&
      players.length > 0 &&
      tableContainerRef.current &&
      scrollPositionRef.current > 0
    ) {
      // Restore immediately in layout effect to prevent flash
      tableContainerRef.current.scrollLeft = scrollPositionRef.current;
      scrollPositionRef.current = 0; // Reset after restoring
    }
  }, [isLoading, players.length]);

  // Preserve scroll position during loading to reduce flash
  useEffect(() => {
    if (
      isLoading &&
      scrollPositionRef.current > 0 &&
      tableContainerRef.current
    ) {
      tableContainerRef.current.scrollLeft = scrollPositionRef.current;
    }
  }, [isLoading]);

  // Infinite scroll logic with scroll event detection
  const lastLoadTriggerRef = useRef<number>(-1);
  
  // Reset infinite scroll trigger when filters change
  useEffect(() => {
    if (filtersChanged) {
      lastLoadTriggerRef.current = -1;
    }
  }, [filtersChanged]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container || !onLoadMore || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Trigger load more when scrolled to within 200px of bottom
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      const isNearBottom = scrollPercentage > 0.9;
      
      if (isNearBottom && scrollTop > lastLoadTriggerRef.current + 100) {
        lastLoadTriggerRef.current = scrollTop;
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Loading states
  if (isLoading && players.length === 0) {
    return (
      <div className='flex h-64 flex-col items-center justify-center space-y-4'>
        <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        <p className='text-muted-foreground text-sm'>Loading players...</p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className='flex h-64 flex-col items-center justify-center space-y-4'>
        <p className='text-lg font-semibold'>No players found</p>
        <p className='text-muted-foreground text-sm'>
          Try adjusting your filters
        </p>
      </div>
    );
  }


  return (
    <div
      className={cn(
        'border-border flex h-full flex-col overflow-hidden rounded-lg border',
        className
      )}
    >

      {/* Direct scroll container without shadcn Table wrapper */}
      <div
        ref={tableContainerRef}
        className='flex-1 overflow-auto'
        style={{ height: '600px' }}
      >
        {/* Custom table with shadcn component styling but no wrapper */}
        <table className='w-full caption-bottom border-separate border-spacing-0 text-sm'>
          {/* Sticky Header with shadcn components */}
          <TableHeader className='bg-background/80 sticky top-0 z-20 rounded-[5px] backdrop-blur-md'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-muted/10'>
                {headerGroup.headers.map((header) => {
                  // Use smaller padding for rating columns to match cells
                  const isLeftColumn = [
                    'id',
                    'name',
                    'tags',
                    'lastSynced',
                  ].includes(header.id);
                  const textAlignment = isLeftColumn
                    ? 'text-left'
                    : 'text-center';

                  // Make actions column sticky on the right
                  const isStickyColumn = header.id === 'actions';

                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        `h-12 px-2.5 ${textAlignment} text-muted-foreground align-middle font-medium`,
                        canSort &&
                          'hover:bg-muted/10 cursor-pointer transition-colors select-none',
                        isStickyColumn &&
                          'bg-background/80 border-border sticky right-0 border-l backdrop-blur-md'
                      )}
                      style={{
                        width: header.getSize(),
                        minWidth: header.getSize(),
                      }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            'flex items-center gap-1 text-xs',
                            textAlignment === 'text-center' && 'justify-center'
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <span className='flex-shrink-0'>
                              {isSorted === 'asc' ? (
                                <ArrowUp className='size-3' />
                              ) : isSorted === 'desc' ? (
                                <ArrowDown className='size-3' />
                              ) : (
                                <ArrowUpDown className='size-3 opacity-50' />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          {/* Virtualized Table Body */}
          <TableBody>
            {/* Virtual spacer before visible rows */}
            {virtualRows.length > 0 && (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  style={{
                    height: `${virtualRows[0]?.start || 0}px`,
                    padding: 0,
                  }}
                />
              </TableRow>
            )}

            {/* Visible rows */}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;

              return (
                <TableRow
                  key={row.id}
                  ref={(node) => rowVirtualizer.measureElement(node)}
                  className='hover:bg-muted/10 dark:hover:bg-muted/20 border-border border-b transition-colors'
                  style={{
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    // Make actions column sticky on the right
                    const isStickyColumn = cell.column.id === 'actions';

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          `px-2.5 py-1 align-middle`,
                          isStickyColumn &&
                            'bg-background/80 border-border sticky right-0 border-l px-2 backdrop-blur-md'
                        )}
                        style={{
                          width: cell.column.getSize(),
                          minWidth: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

            {/* Virtual spacer after visible rows */}
            {virtualRows.length > 0 && (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  style={{
                    height: `${
                      rowVirtualizer.getTotalSize() -
                      (virtualRows[virtualRows.length - 1]?.end || 0)
                    }px`,
                    padding: 0,
                  }}
                />
              </TableRow>
            )}

            {/* Loading indicator */}
            {isFetchingNextPage && (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className='h-16 text-center'
                >
                  <div className='flex items-center justify-center space-x-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span className='text-muted-foreground text-sm'>
                      Loading more players...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
