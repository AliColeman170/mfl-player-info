import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Search, X, XIcon } from 'lucide-react';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { cn } from '@/utils/helpers';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search players...',
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedOnChange = useDebouncedCallback(onChange, debounceMs);

  // Sync with external value changes (e.g., clearing filters)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange(''); // Fire immediately
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
      <Input
        ref={inputRef}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className='h-10 pr-9 pl-9'
      />
      {localValue && (
        <Button
          variant='ghost'
          size='sm'
          className='hover:bg-muted absolute top-1/2 right-1 size-7 -translate-y-1/2 p-0'
          onClick={handleClear}
        >
          <XIcon className='size-3' />
          <span className='sr-only'>Clear search</span>
        </Button>
      )}
    </div>
  );
}
