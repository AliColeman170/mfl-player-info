import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { SpinnerIcon } from '../SpinnerIcon';
import { useEffect, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { Player } from '@/types/global.types';
import { cn, isPositiveInteger } from '@/utils/helpers';

export function SearchComboBox({
  id,
  isLoading,
  handlePlayerChange,
  placeholder = 'Search player name or ID...',
  autofocus = false,
}: {
  id?: number;
  isLoading?: boolean;
  handlePlayerChange: (id: number) => void;
  placeholder?: string;
  autofocus?: boolean;
}) {
  let [query, setQuery] = useDebounceValue('', 800);
  let [filteredOptions, setFilteredOptions] = useState<Player[] | null>(null);
  let [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  let [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    async function fetchSearchResults() {
      if (isPositiveInteger(+query)) {
        setFilteredOptions(null);
        handlePlayerChange(+query);
      } else {
        setIsSearching(true);
        if (query.length >= 3) {
          const result: Player[] = await fetch(
            `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?limit=10&sorts=metadata.overall&sortsOrders=DESC&name=${query}&excludingMflOwned=false`
          ).then((res) => res.json());
          setFilteredOptions(result);
        }
        setIsSearching(false);
      }
    }
    if (query !== '') {
      fetchSearchResults();
    }
  }, [query, handlePlayerChange]);

  useEffect(() => {
    if (selectedPlayer) {
      handlePlayerChange(selectedPlayer.id);
    }
  }, [selectedPlayer, handlePlayerChange]);

  return (
    <Combobox
      disabled={isLoading}
      value={selectedPlayer}
      onChange={(option) => {
        setQuery('');
        setSelectedPlayer(option);
      }}
      as='div'
    >
      <div className='mx-auto w-full divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-2xl shadow-slate-300 ring-1 ring-slate-900 ring-opacity-5 dark:bg-slate-900 dark:shadow-slate-900 dark:ring-slate-800'>
        <div className='relative'>
          <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-3 h-6 w-6 text-slate-400 sm:left-4 sm:top-4 sm:h-8 sm:w-8 dark:text-slate-600' />
          <ComboboxInput
            defaultValue={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className='h-12 w-full border-0 bg-transparent pl-12 pr-4 text-lg text-slate-900 placeholder:text-slate-400 focus:ring-0 disabled:text-opacity-50 sm:h-16 sm:pl-16 sm:text-xl dark:text-slate-400'
            displayValue={() => {
              if (selectedPlayer) return `${selectedPlayer.id}`;
              if (id) return id.toString();
              return '';
            }}
            autoFocus={autofocus}
          />
          {(isSearching || isLoading) && (
            <SpinnerIcon className='absolute right-4 top-3 h-6 w-6 animate-spin text-slate-400 sm:right-5 sm:top-5' />
          )}
        </div>
      </div>

      {filteredOptions && (
        <ComboboxOptions className='absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-xl shadow-slate-200 ring-1 ring-slate-950 ring-opacity-5 focus:outline-none dark:bg-slate-950 dark:shadow-slate-900 dark:ring-slate-800'>
          {filteredOptions.length === 0 &&
          query !== '' &&
          !isPositiveInteger(+query) ? (
            <div className='relative cursor-default select-none py-5 pl-6 pr-9 text-slate-900 dark:text-slate-50'>
              No players found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.id}
                value={option}
                className={({ active }) => {
                  return cn(
                    'relative cursor-default select-none py-2 pl-4 pr-9 focus:outline-none',
                    active
                      ? 'bg-slate-50 text-slate-950 dark:bg-slate-900 dark:text-white'
                      : 'text-slate-900 dark:text-slate-50'
                  );
                }}
              >
                {({ active, selected }) => (
                  <>
                    <div className='flex items-center space-x-3'>
                      <Image
                        className='w-8'
                        src={`https://d13e14gtps4iwl.cloudfront.net/players/${option.id}/card_512.png`}
                        alt={`Player ${option.id}`}
                        width='512'
                        height='748'
                        unoptimized
                        priority
                      />
                      <div
                        className={cn(
                          'block truncate',
                          selected ? 'font-semibold' : 'font-normal'
                        )}
                      >
                        {`${option.metadata.firstName} ${option.metadata.lastName}`}
                      </div>
                    </div>
                    {selected && (
                      <span
                        className={cn(
                          'absolute inset-y-0 right-0 flex items-center pr-4',
                          active
                            ? 'text-indigo-600 dark:text-white'
                            : 'text-indigo-500 dark:text-slate-100'
                        )}
                      >
                        <svg
                          className='h-5 w-5'
                          viewBox='0 0 20 20'
                          fill='currentColor'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </span>
                    )}
                  </>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      )}
    </Combobox>
  );
}
