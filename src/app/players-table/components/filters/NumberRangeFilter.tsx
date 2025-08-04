'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/UI/label';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { X } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface NumberRangeFilterProps {
  label: string;
  min?: number;
  max?: number;
  defaultMin?: number;
  defaultMax?: number;
  absoluteMin?: number;
  absoluteMax?: number;
  onChange: (min?: number, max?: number) => void;
  className?: string;
  suffix?: string;
}

export function NumberRangeFilter({
  label,
  min,
  max,
  defaultMin = 0,
  defaultMax = 100,
  absoluteMin = 0,
  absoluteMax = 100,
  onChange,
  className,
  suffix = '',
}: NumberRangeFilterProps) {
  const [localMin, setLocalMin] = useState<string>(min?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(max?.toString() || '');

  // Sync with external changes
  useEffect(() => {
    setLocalMin(min?.toString() || '');
    setLocalMax(max?.toString() || '');
  }, [min, max]);

  const handleMinChange = (value: string) => {
    setLocalMin(value);
    const numValue = value === '' ? undefined : parseInt(value);
    if (
      numValue === undefined ||
      (!isNaN(numValue) && numValue >= absoluteMin)
    ) {
      onChange(numValue, max);
    }
  };

  const handleMaxChange = (value: string) => {
    setLocalMax(value);
    const numValue = value === '' ? undefined : parseInt(value);
    if (
      numValue === undefined ||
      (!isNaN(numValue) && numValue <= absoluteMax)
    ) {
      onChange(min, numValue);
    }
  };

  const handleClear = () => {
    setLocalMin('');
    setLocalMax('');
    onChange(undefined, undefined);
  };

  const hasValue = min !== undefined || max !== undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-medium'>{label}</Label>
        {hasValue && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleClear}
            className='hover:bg-muted h-6 w-6 p-0'
          >
            <X className='h-3 w-3' />
            <span className='sr-only'>Clear {label}</span>
          </Button>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <Input
          type='number'
          value={localMin}
          onChange={(e) => handleMinChange(e.target.value)}
          placeholder={defaultMin.toString()}
          min={absoluteMin}
          max={absoluteMax}
          className='h-9'
        />
        <span className='text-muted-foreground text-sm'>to</span>
        <Input
          type='number'
          value={localMax}
          onChange={(e) => handleMaxChange(e.target.value)}
          placeholder={defaultMax.toString()}
          min={absoluteMin}
          max={absoluteMax}
          className='h-9'
        />
        {suffix && (
          <span className='text-muted-foreground text-sm'>{suffix}</span>
        )}
      </div>

      {hasValue && (
        <div className='text-muted-foreground text-xs'>
          {min || defaultMin} - {max || defaultMax}
          {suffix}
        </div>
      )}
    </div>
  );
}
