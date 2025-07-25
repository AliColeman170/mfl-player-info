'use client';

import { useCallback, useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { cn } from '@/utils/helpers';
import { usePlayerFilters } from '../../hooks/usePlayerFilters';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useTableControls } from '../../contexts/TableControlsContext';
import { SearchInput } from './SearchInput';
import { ColumnVisibilityToggle } from './ColumnVisibilityToggle';
import { FilterDrawer } from './FilterDrawer';

interface FilterToolbarProps {
  className?: string;
}

export function FilterToolbar({ className }: FilterToolbarProps) {
  const { filters, updateFilter, clearAllFilters, activeFilterCount } =
    usePlayerFilters();

  const { tableControls } = useTableControls();
  const [, forceUpdate] = useState(0);

  // Get current visibility from table instead of localStorage
  const currentVisibility = tableControls?.getCurrentVisibility() || {};

  // Force re-render when table state might have changed
  const triggerUpdate = useCallback(() => {
    forceUpdate((prev) => prev + 1);
  }, []);

  // Wrapper functions to use table controls
  const handleColumnVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      if (tableControls) {
        tableControls.toggleColumn(columnId);
        // Force UI update after change
        setTimeout(triggerUpdate, 0);
      }
    },
    [tableControls, triggerUpdate]
  );

  const handleShowAll = useCallback(() => {
    if (tableControls) {
      tableControls.showAllColumns();
      setTimeout(triggerUpdate, 0);
    }
  }, [tableControls, triggerUpdate]);

  const handleHideAll = useCallback(() => {
    if (tableControls) {
      tableControls.hideAllColumns();
      setTimeout(triggerUpdate, 0);
    }
  }, [tableControls, triggerUpdate]);

  const handleReset = useCallback(() => {
    if (tableControls) {
      tableControls.resetColumns();
      setTimeout(triggerUpdate, 0);
    }
  }, [tableControls, triggerUpdate]);

  return (
    <div className={cn('grid gap-4', className)}>
      {/* Main Filter Row */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        {/* Search */}
        <div className='flex flex-1 gap-2'>
          <SearchInput
            value={filters.search}
            onChange={(value) => updateFilter('search', value)}
            placeholder='Search by player name or ID...'
            className='flex-1'
          />
        </div>

        {/* Filter Controls */}
        <div className='flex items-center gap-2'>
          {/* Column Visibility Toggle */}
          <ColumnVisibilityToggle
            columnVisibility={currentVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onResetToDefault={handleReset}
            onShowAll={handleShowAll}
            onHideAll={handleHideAll}
          />

          {/* Filter Drawer */}
          <FilterDrawer />

          {activeFilterCount > 0 && (
            <Button variant='outline' size='lg' onClick={clearAllFilters}>
              <XIcon />
              <span>Clear All</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
