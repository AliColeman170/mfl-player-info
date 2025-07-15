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
  let [query, setQuery] = useState(id ? id.toString() : '');
  let [debouncedQuery] = useDebounceValue(query, 800);
  let [filteredOptions, setFilteredOptions] = useState<Player[] | null>(null);
  let [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  let [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Update query when id prop changes
  useEffect(() => {
    if (id && query !== id.toString()) {
      setQuery(id.toString());
    }
  }, [id]); // Only depend on id, not query to avoid infinite loops

  useEffect(() => {
    async function fetchSearchResults() {
      if (debouncedQuery === '') {
        setFilteredOptions(null);
        setIsSearching(false);
        return;
      }
      
      if (isPositiveInteger(+debouncedQuery)) {
        setFilteredOptions(null);
        setIsSearching(false);
        // Only trigger player change if it's different from current player
        if (+debouncedQuery !== id) {
          handlePlayerChange(+debouncedQuery);
        }
      } else if (debouncedQuery.length >= 3) {
        setIsSearching(true);
        try {
          const result: Player[] = await fetch(
            `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/players?limit=10&sorts=metadata.overall&sortsOrders=DESC&name=${encodeURIComponent(debouncedQuery)}&excludingMflOwned=false`
          ).then((res) => res.json());
          setFilteredOptions(result);
        } catch (error) {
          console.error('Search failed:', error);
          setFilteredOptions([]);
        }
        setIsSearching(false);
      } else {
        setFilteredOptions(null);
        setIsSearching(false);
      }
    }
    
    fetchSearchResults();
  }, [debouncedQuery, handlePlayerChange]);

  return (
    <Combobox
      disabled={isLoading}
      value={selectedPlayer}
      onChange={(option) => {
        if (option) {
          setSelectedPlayer(option);
          setQuery(option.id.toString());
          setFilteredOptions(null);
          // Only trigger player change if it's different from current player
          if (option.id !== id) {
            handlePlayerChange(option.id);
          }
        }
      }}
      as='div'
    >
      <div className='bg-card outline-border focus-within:outline-primary shadow-foreground/5 mx-auto w-full overflow-hidden rounded-xl shadow-2xl outline-1 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2'>
        <div className='relative'>
          <MagnifyingGlassIcon className='text-muted pointer-events-none absolute top-3 left-3 h-6 w-6 sm:top-4 sm:left-4 sm:h-8 sm:w-8' />
          <ComboboxInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedPlayer(null);
            }}
            placeholder={placeholder}
            className='disabled:text-opacity-50 text-foreground placeholder:text-muted h-12 w-full bg-transparent pr-4 pl-12 text-lg sm:h-16 sm:pl-16 sm:text-xl'
            displayValue={(player: Player | null) => {
              if (player) return `${player.metadata.firstName} ${player.metadata.lastName}`;
              return query;
            }}
            autoFocus={autofocus}
          />
          {(isSearching || isLoading) && (
            <SpinnerIcon className='text-muted absolute top-3 right-4 h-6 w-6 animate-spin sm:top-5 sm:right-5' />
          )}
        </div>
      </div>

      {filteredOptions && (
        <ComboboxOptions className='bg-popover shadow-foreground/5 ring-ring absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg py-1 text-base shadow-xl ring-1 focus:outline-hidden'>
          {filteredOptions.length === 0 &&
          debouncedQuery !== '' &&
          !isPositiveInteger(+debouncedQuery) ? (
            <div className='text-popover-foreground relative cursor-default py-5 pr-9 pl-6 select-none'>
              No players found.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <ComboboxOption
                key={option.id}
                value={option}
                className='group data-active:bg-accent data-active:text-accent-foreground relative cursor-default py-2 pr-9 pl-4 select-none focus:outline-hidden'
              >
                {() => (
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
                          option.id === id ? 'font-semibold' : 'font-normal'
                        )}
                      >
                        {`${option.metadata.firstName} ${option.metadata.lastName}`}
                      </div>
                    </div>
                    {option.id === id && (
                      <span
                        className={
                          'group-data-active:text-primary absolute inset-y-0 right-0 flex items-center pr-4'
                        }
                      >
                        <svg
                          className='size-5'
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
