'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/UI/button-alt';
import { Input } from '@/components/UI/input';
import { cn } from '@/lib/utils';
import { Search, Loader2 } from 'lucide-react';
import { useInfiniteFilterOptions } from '../../hooks/useInfiniteFilterOptions';
import { useVirtualizer } from '@tanstack/react-virtual';

interface InfiniteFilterCheckboxProps {
  optionType: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxHeight?: string;
  formatLabel?: (value: string) => string;
  getCount?: (value: string) => number;
  renderIcon?: (value: string) => React.ReactNode;
  showSelectButtons?: boolean;
  showSearch?: boolean;
}

export function InfiniteFilterCheckbox({
  optionType,
  selectedValues,
  onChange,
  placeholder = 'Search options...',
  maxHeight = 'max-h-48',
  formatLabel,
  getCount,
  renderIcon,
  showSelectButtons = true,
  showSearch = true,
}: InfiniteFilterCheckboxProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteFilterOptions(optionType, searchQuery);

  // Flatten all pages into a single array
  const allOptions = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.items) ?? [];
  }, [data]);

  // Add selected items that might not be in the current results
  const optionsWithSelected = useMemo(() => {
    const optionSet = new Set(allOptions);
    const missingSelected = selectedValues.filter(
      (value) => !optionSet.has(value)
    );
    return [...missingSelected, ...allOptions];
  }, [allOptions, selectedValues]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: optionsWithSelected.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // Estimate height of each item
    overscan: 5,
  });

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    onChange(optionsWithSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectOnly = (value: string) => {
    onChange([value]);
  };

  // Load more when scrolling near the end
  const handleScroll = useCallback(() => {
    if (!parentRef.current || !hasNextPage || isFetchingNextPage) return;

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        {showSearch && (
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2' />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-8 pl-7 text-xs'
            />
            {isFetching && (
              <Loader2 className='text-muted-foreground absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 animate-spin' />
            )}
          </div>
        )}

        {showSelectButtons && (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSelectAll}
              disabled={
                optionsWithSelected.length === selectedValues.length ||
                isLoading
              }
              className='h-6 text-xs'
            >
              Select All
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleClearAll}
              disabled={selectedValues.length === 0}
              className='h-6 text-xs'
            >
              Clear
            </Button>
          </div>
        )}

        <div
          ref={parentRef}
          className={`space-y-1 overflow-y-auto ${maxHeight}`}
          onScroll={handleScroll}
          style={{
            height: `min(${virtualizer.getTotalSize()}px, 192px)`, // 192px = max-h-48
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const option = optionsWithSelected[virtualItem.index];
              const isSelected = selectedValues.includes(option);
              const label = formatLabel ? formatLabel(option) : option;
              const count = getCount ? getCount(option) : undefined;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div
                    className={cn(
                      'hover:bg-accent group flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm',
                      isSelected && 'bg-accent'
                    )}
                    onClick={() => handleToggle(option)}
                  >
                    <div className='flex w-full items-center justify-between gap-x-3'>
                      <div className='flex items-center gap-x-3'>
                        <div
                          className={cn(
                            'border-primary flex h-4 w-4 items-center justify-center rounded-sm border',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )}
                        >
                          <svg
                            className='size-3'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M5 13l4 4L19 7'
                            />
                          </svg>
                        </div>
                        <div className='flex items-center justify-between gap-x-2'>
                          {renderIcon && renderIcon(option)}
                          <span className='truncate'>{label}</span>
                        </div>
                      </div>
                      {count !== undefined && (
                        <span className='text-foreground px-2 text-xs tabular-nums'>
                          {count}
                        </span>
                      )}
                    </div>
                    {selectedValues.length > 1 && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOnly(option);
                        }}
                        className='bg-accent/0 group-hover:bg-accent/80 absolute right-0 h-auto px-3 py-0 text-sm/5 text-white/0 group-hover:text-white/70 group-hover:backdrop-blur-sm hover:text-white'
                      >
                        only
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className='flex items-center justify-center py-2'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span className='text-muted-foreground ml-2 text-xs'>
              Loading more...
            </span>
          </div>
        )}

        {/* No results */}
        {!isLoading && optionsWithSelected.length === 0 && (
          <div className='text-muted-foreground py-4 text-center text-xs'>
            No options found
          </div>
        )}

        {/* Initial loading */}
        {isLoading && (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-4 w-4 animate-spin' />
            <span className='text-muted-foreground ml-2 text-xs'>
              Loading...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
