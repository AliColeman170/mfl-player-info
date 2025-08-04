import { useState } from 'react';
import { Button } from '@/components/UI/button-alt';
import { Input } from '@/components/UI/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface FilterCheckboxProps {
  options: string[];
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

export function FilterCheckbox({
  options,
  selectedValues,
  onChange,
  placeholder = 'Search options...',
  maxHeight = 'max-h-48',
  formatLabel,
  getCount,
  renderIcon,
  showSelectButtons = true,
  showSearch = true,
}: FilterCheckboxProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = showSearch
    ? options.filter((option) => {
        const label = formatLabel ? formatLabel(option) : option;
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : options;

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    onChange(filteredOptions);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectOnly = (value: string) => {
    onChange([value]);
  };

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
          </div>
        )}

        {showSelectButtons && (
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSelectAll}
              disabled={filteredOptions.length === selectedValues.length}
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

        <div className={`space-y-1 overflow-y-auto ${maxHeight}`}>
          {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option);
            const label = formatLabel ? formatLabel(option) : option;
            const count = getCount ? getCount(option) : undefined;

            return (
              <div
                key={option}
                className={cn(
                  'hover:bg-accent group relative flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm',
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
            );
          })}
        </div>

        {filteredOptions.length === 0 && (
          <div className='text-muted-foreground py-4 text-center text-xs'>
            No options found
          </div>
        )}
      </div>
    </div>
  );
}
