import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { ChangeEventHandler, useEffect, useRef } from 'react';

export function SearchInput({
  placeholder = 'Player ID...',
  value,
  handleSearch,
  isLoading = false,
  autoFocus = false,
}: {
  placeholder?: string;
  value: string;
  handleSearch: ChangeEventHandler<HTMLInputElement>;
  isLoading?: boolean;
  autoFocus?: boolean;
}) {
  const innerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (innerRef.current && autoFocus) {
      innerRef.current.focus();
      var val = innerRef.current.value;
      innerRef.current.value = '';
      innerRef.current.value = val;
    }
  });
  return (
    <div className='mx-auto w-full divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-2xl shadow-slate-300 ring-1 ring-slate-900 ring-opacity-5 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800'>
      <div className='relative'>
        <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-3 h-6 w-6 text-slate-400 sm:left-4 sm:top-4 sm:h-8 sm:w-8 dark:text-slate-600' />
        <input
          ref={innerRef}
          type='number'
          step={1}
          min={1}
          className='h-12 w-full border-0 bg-transparent pl-12 pr-4 text-lg text-slate-900 [appearance:textfield] placeholder:text-slate-400 focus:ring-0 sm:h-16 sm:pl-16 sm:text-xl dark:text-slate-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
          placeholder={placeholder}
          defaultValue={value}
          onChange={handleSearch}
          pattern='[0-9]*'
          inputMode='numeric'
        />
        {isLoading && (
          <SpinnerIcon className='absolute right-4 top-3 h-6 w-6 animate-spin text-slate-400 sm:right-5 sm:top-5' />
        )}
      </div>
    </div>
  );
}
