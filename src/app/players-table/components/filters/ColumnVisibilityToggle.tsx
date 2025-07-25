import { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, Settings2Icon } from 'lucide-react';
import { Button } from '@/components/UI/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/UI/popover';
import { Checkbox } from '@/components/UI/checkbox';
import { Label } from '@/components/UI/label';
import { Separator } from '@/components/UI/separator';
import { columnConfig, columnLabels } from '../table/columns';
import { VisibilityState } from '@tanstack/react-table';

interface ColumnVisibilityToggleProps {
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onResetToDefault: () => void;
  onShowAll?: () => void;
  onHideAll?: () => void;
}

export function ColumnVisibilityToggle({
  columnVisibility,
  onColumnVisibilityChange,
  onResetToDefault,
  onShowAll,
  onHideAll,
}: ColumnVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration by ensuring consistent state
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const allColumns = Object.keys(columnLabels);
  const totalCount = allColumns.length;

  // Calculate visible count safely to avoid hydration issues
  const visibleCount = isHydrated
    ? Object.values(columnVisibility).filter(Boolean).length
    : columnConfig.defaultVisible.length; // Use default count during SSR

  const handleShowAll = () => {
    if (onShowAll) {
      onShowAll();
    } else {
      // Fallback to individual updates
      allColumns.forEach((columnId) => {
        if (!columnConfig.alwaysVisible.includes(columnId)) {
          onColumnVisibilityChange(columnId, true);
        }
      });
    }
  };

  const handleHideAll = () => {
    if (onHideAll) {
      onHideAll();
    } else {
      // Fallback to individual updates
      allColumns.forEach((columnId) => {
        if (!columnConfig.alwaysVisible.includes(columnId)) {
          onColumnVisibilityChange(columnId, false);
        }
      });
    }
  };

  const isColumnVisible = (columnId: string) => {
    if (!isHydrated) {
      // During SSR, use default visibility to avoid hydration mismatch
      return columnConfig.defaultVisible.includes(columnId);
    }
    // After hydration, use actual state
    return (
      columnVisibility[columnId] ??
      columnConfig.defaultVisible.includes(columnId)
    );
  };
  const isColumnToggleable = (columnId: string) =>
    !columnConfig.alwaysVisible.includes(columnId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='lg'>
          <Settings2Icon />
          <span>Columns</span>
          <span className='text-muted-foreground text-xs'>
            ({visibleCount}/{totalCount})
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-56' align='end'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Toggle columns</h4>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleShowAll}
                className='h-8 flex-1 text-xs'
              >
                <EyeIcon />
                Show All
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleHideAll}
                className='h-8 flex-1 text-xs'
              >
                <EyeOffIcon />
                Hide All
              </Button>
            </div>
          </div>

          <Separator />

          <div className='max-h-64 space-y-2 overflow-y-auto'>
            {allColumns.map((columnId) => {
              const label = columnLabels[columnId];
              const visible = isColumnVisible(columnId);
              const toggleable = isColumnToggleable(columnId);

              return (
                <div key={columnId} className='flex items-center gap-x-2'>
                  <Checkbox
                    id={columnId}
                    checked={visible}
                    onCheckedChange={(checked) =>
                      onColumnVisibilityChange(columnId, !!checked)
                    }
                    disabled={!toggleable}
                  />
                  <Label
                    htmlFor={columnId}
                    className={`flex-1 text-sm ${!toggleable ? 'text-muted-foreground' : ''}`}
                  >
                    {label}
                    {!toggleable && (
                      <span className='ml-1 text-xs'>(required)</span>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>

          <Separator />

          <Button
            variant='ghost'
            size='sm'
            onClick={onResetToDefault}
            className='w-full text-xs'
          >
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
