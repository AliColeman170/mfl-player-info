'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/UI/button-alt';
import { Badge } from '@/components/UI/badge';
import { Switch } from '@/components/UI/switch';
import { Label } from '@/components/UI/label';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/UI/drawer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/UI/accordion';
import { usePlayerFilters } from '../../hooks/usePlayerFilters';
import { useFilterOptions } from '../../hooks/useFilterOptions';
import { FilterSlider } from './FilterSlider';
import { WalletAddressFilter } from './WalletAddressFilter';
import { DEFAULT_RANGES } from '../../lib/filter-schema';
import { POSITION_ORDER } from '@/lib/constants';
import { CountryFlag } from '@/components/UI/country-flag';
import { Heart, HeartOff } from 'lucide-react';
import { useUser } from '@/components/Wallet/UserProvider';
import { use } from 'react';
import { useFilterCounts } from '../../hooks/useFilterCounts';
import { FilterCheckboxWithCounts } from './FilterCheckboxWithCounts';
import { InfiniteFilterCheckboxWithCounts } from './InfiniteFilterCheckboxWithCounts';

// Helper function to format labels for display while keeping database values
function formatLabel(value: string): string {
  if (value === 'UNITED_STATES') return 'United States';
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// All possible positions in correct order
const ALL_POSITIONS = [...POSITION_ORDER];

const PREFERRED_FOOT = ['LEFT', 'RIGHT'];

const FAVOURITE_OPTIONS = [
  { value: 'favourites', label: 'Favourites', icon: Heart },
  { value: 'non-favourites', label: 'Non-Favourites', icon: HeartOff },
];

export function FilterDrawer() {
  const [open, setOpen] = useState(false);
  const {
    filters,
    updateFilter,
    updateNumberRange,
    clearAllFilters,
    activeFilterCount,
    apiFilters,
  } = usePlayerFilters();

  const { data: filterOptions, isLoading: isLoadingOptions } =
    useFilterOptions();

  // Check if user is logged in
  const { userPromise } = useUser();

  // Get dynamic filter counts based on current filters
  const { data: filterCounts, isLoading: countsLoading } = useFilterCounts(
    apiFilters,
    userPromise ? use(userPromise)?.app_metadata?.address : undefined
  );
  const user = use(userPromise);
  const isLoggedIn = !!user?.app_metadata?.address;

  const handleSliderChange = (
    field: string,
    value: [number, number],
    defaultValue: [number, number]
  ) => {
    updateNumberRange(
      field as any,
      value[0] === defaultValue[0] ? undefined : value[0],
      value[1] === defaultValue[1] ? undefined : value[1]
    );
  };

  const handleSliderClear = (field: string) => {
    updateNumberRange(field as any, undefined, undefined);
  };

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      direction='right'
      handleOnly={true}
    >
      <DrawerTrigger asChild>
        <Button variant='outline' size='lg' className='gap-2'>
          <Filter />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge className='ml-1 h-5 px-1.5 text-xs'>
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className='w-72'>
        <DrawerHeader className='border-b'>
          <div className='flex items-center justify-between'>
            <div>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>
                Filter players by various criteria
              </DrawerDescription>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={clearAllFilters}
                className='gap-1'
              >
                <X className='h-3 w-3' />
                Clear All
              </Button>
            )}
          </div>
        </DrawerHeader>

        <div className='flex-1 overflow-y-auto p-4'>
          <Accordion
            type='multiple'
            defaultValue={isLoggedIn ? ['favourites'] : ['overall']}
            className='w-full'
          >
            {/* Favourites Filter - Only show for logged-in users */}
            {isLoggedIn && (
              <AccordionItem value='favourites'>
                <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                  <div className='flex w-full items-center justify-between'>
                    <span>Favourites</span>
                    {filters.favourites !== 'all' && (
                      <div
                        role='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFilter('favourites', 'all');
                        }}
                        className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                      >
                        {' '}
                        Clear
                        <X className='size-3' />
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FilterCheckboxWithCounts
                    options={FAVOURITE_OPTIONS.map((opt) => opt.value)}
                    selectedValues={
                      filters.favourites !== 'all' ? [filters.favourites] : []
                    }
                    onChange={(values) => {
                      // Handle toggling behavior - if the same option is clicked, clear it
                      // If a different option is clicked, set it
                      const newValue =
                        values.length > 0 ? values[values.length - 1] : 'all';

                      // If the clicked value is already selected, deselect it (go back to 'all')
                      if (newValue === filters.favourites) {
                        updateFilter('favourites', 'all');
                      } else {
                        updateFilter('favourites', newValue);
                      }
                    }}
                    placeholder='Select favourites filter...'
                    maxHeight='max-h-32'
                    formatLabel={(value) =>
                      FAVOURITE_OPTIONS.find((opt) => opt.value === value)
                        ?.label || value
                    }
                    renderIcon={(value) => {
                      const option = FAVOURITE_OPTIONS.find(
                        (opt) => opt.value === value
                      );
                      if (!option) return null;
                      const Icon = option.icon;
                      return (
                        <Icon
                          className={`h-4 w-4 ${value === 'favourites' ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
                        />
                      );
                    }}
                    showSelectButtons={false}
                    showSearch={false}
                    counts={filterCounts?.favourites}
                    showCounts={!countsLoading}
                  />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Tags Filter */}
            {filterOptions?.tags && filterOptions.tags.length > 0 && (
              <AccordionItem value='tags'>
                <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                  <div className='flex w-full items-center justify-between'>
                    <span>Tags</span>
                    {filters.tags.length > 0 && (
                      <div
                        role='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          updateFilter('tags', []);
                        }}
                        className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                      >
                        Clear
                        <X className='size-3' />
                      </div>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {isLoadingOptions ? (
                    <div className='flex items-center justify-center py-4'>
                      Loading tags...
                    </div>
                  ) : (
                    <div className='flex flex-col gap-4'>
                      <InfiniteFilterCheckboxWithCounts
                        optionType='tags'
                        selectedValues={filters.tags}
                        onChange={(values) => updateFilter('tags', values)}
                        placeholder='Search tags...'
                        formatLabel={formatLabel}
                        showSelectButtons={false}
                        counts={filterCounts?.tags}
                        showCounts={!countsLoading}
                      />
                      {filters.tags.length > 1 && (
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center justify-between'>
                            <Label
                              htmlFor='tags-match-mode'
                              className='text-sm/5'
                            >
                              Match all selected tags
                            </Label>
                            <Switch
                              id='tags-match-mode'
                              checked={filters.tagsMatchAll}
                              onCheckedChange={(checked: boolean) =>
                                updateFilter('tagsMatchAll', checked)
                              }
                            />
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {filters.tagsMatchAll
                              ? 'Show players that have ALL selected tags'
                              : 'Show players that have ANY of the selected tags'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Overall Rating Filter */}
            <AccordionItem value='overall'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Overall Rating</span>
                  {(filters.overallMin !== null ||
                    filters.overallMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('overall');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.overallMin ?? DEFAULT_RANGES.ratings.min,
                    filters.overallMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('overall', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Age Filter */}
            <AccordionItem value='age'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Age</span>
                  {(filters.ageMin !== null || filters.ageMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('age');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.age.min}
                  max={DEFAULT_RANGES.age.max}
                  value={[
                    filters.ageMin ?? DEFAULT_RANGES.age.min,
                    filters.ageMax ?? DEFAULT_RANGES.age.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('age', value, [
                      DEFAULT_RANGES.age.min,
                      DEFAULT_RANGES.age.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Height Filter */}
            <AccordionItem value='height'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Height</span>
                  {(filters.heightMin !== null ||
                    filters.heightMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('height');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.height.min}
                  max={DEFAULT_RANGES.height.max}
                  value={[
                    filters.heightMin ?? DEFAULT_RANGES.height.min,
                    filters.heightMax ?? DEFAULT_RANGES.height.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('height', value, [
                      DEFAULT_RANGES.height.min,
                      DEFAULT_RANGES.height.max,
                    ])
                  }
                  suffix='cm'
                  showSuffixOnInputs={true}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Nationality Filter */}
            <AccordionItem value='nationality'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Nationality</span>
                  {filters.nationalities.length > 0 && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('nationalities', []);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <InfiniteFilterCheckboxWithCounts
                  optionType='nationalities'
                  selectedValues={filters.nationalities}
                  onChange={(values) => updateFilter('nationalities', values)}
                  placeholder='Search nationalities...'
                  formatLabel={formatLabel}
                  renderIcon={(country) => (
                    <CountryFlag country={country} className='rounded-xs' />
                  )}
                  showSelectButtons={false}
                  counts={filterCounts?.nationalities}
                  showCounts={!countsLoading}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Preferred Foot Filter */}
            <AccordionItem value='preferredFoot'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Preferred Foot</span>
                  {filters.preferredFoot && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('preferredFoot', null);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterCheckboxWithCounts
                  options={filterOptions?.preferredFoot || PREFERRED_FOOT}
                  selectedValues={
                    filters.preferredFoot ? [filters.preferredFoot] : []
                  }
                  onChange={(values) => {
                    // Handle toggling behavior - if the same option is clicked, clear it
                    // If a different option is clicked, set it
                    const newValue =
                      values.length > 0 ? values[values.length - 1] : null;

                    // If the clicked value is already selected, deselect it (go back to null)
                    if (newValue === filters.preferredFoot) {
                      updateFilter('preferredFoot', null);
                    } else {
                      updateFilter('preferredFoot', newValue);
                    }
                  }}
                  placeholder='Select foot...'
                  maxHeight='max-h-32'
                  formatLabel={formatLabel}
                  showSelectButtons={false}
                  showSearch={false}
                  counts={filterCounts?.preferredFoot}
                  showCounts={!countsLoading}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Primary Positions Filter */}
            <AccordionItem value='primaryPositions'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Primary Positions</span>
                  {filters.primaryPositions.length > 0 && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('primaryPositions', []);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterCheckboxWithCounts
                  options={ALL_POSITIONS}
                  selectedValues={filters.primaryPositions}
                  onChange={(values) =>
                    updateFilter('primaryPositions', values)
                  }
                  placeholder='Search positions...'
                  showSelectButtons={false}
                  showSearch={false}
                  counts={filterCounts?.primaryPositions}
                  showCounts={!countsLoading}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Secondary Positions Filter */}
            <AccordionItem value='secondaryPositions'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Secondary Positions</span>
                  {filters.secondaryPositions.length > 0 && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('secondaryPositions', []);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterCheckboxWithCounts
                  options={ALL_POSITIONS}
                  selectedValues={filters.secondaryPositions}
                  onChange={(values) =>
                    updateFilter('secondaryPositions', values)
                  }
                  placeholder='Search positions...'
                  showSelectButtons={false}
                  showSearch={false}
                  counts={filterCounts?.secondaryPositions}
                  showCounts={!countsLoading}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Pace Rating Filter */}
            <AccordionItem value='pace'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Pace</span>
                  {(filters.paceMin !== null || filters.paceMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('pace');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.paceMin ?? DEFAULT_RANGES.ratings.min,
                    filters.paceMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('pace', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Shooting Rating Filter */}
            <AccordionItem value='shooting'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Shooting</span>
                  {(filters.shootingMin !== null ||
                    filters.shootingMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('shooting');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.shootingMin ?? DEFAULT_RANGES.ratings.min,
                    filters.shootingMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('shooting', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Passing Rating Filter */}
            <AccordionItem value='passing'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Passing</span>
                  {(filters.passingMin !== null ||
                    filters.passingMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('passing');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.passingMin ?? DEFAULT_RANGES.ratings.min,
                    filters.passingMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('passing', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Dribbling Rating Filter */}
            <AccordionItem value='dribbling'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Dribbling</span>
                  {(filters.dribblingMin !== null ||
                    filters.dribblingMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('dribbling');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.dribblingMin ?? DEFAULT_RANGES.ratings.min,
                    filters.dribblingMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('dribbling', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Defense Rating Filter */}
            <AccordionItem value='defense'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Defense</span>
                  {(filters.defenseMin !== null ||
                    filters.defenseMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('defense');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.defenseMin ?? DEFAULT_RANGES.ratings.min,
                    filters.defenseMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('defense', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Physical Rating Filter */}
            <AccordionItem value='physical'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Physical</span>
                  {(filters.physicalMin !== null ||
                    filters.physicalMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('physical');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.physicalMin ?? DEFAULT_RANGES.ratings.min,
                    filters.physicalMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('physical', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Owner Filter */}
            <AccordionItem value='owner'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Owner</span>
                  {filters.owners.length > 0 && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('owners', []);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {isLoadingOptions ? (
                  <div className='text-muted-foreground py-4 text-center text-xs'>
                    Loading owners...
                  </div>
                ) : (
                  <InfiniteFilterCheckboxWithCounts
                    optionType='owners'
                    selectedValues={filters.owners}
                    onChange={(values) => updateFilter('owners', values)}
                    placeholder='Search owners...'
                    showSelectButtons={false}
                    counts={filterCounts?.owners}
                    showCounts={!countsLoading}
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Wallet Address Filter */}
            <AccordionItem value='walletAddress'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Wallet Address</span>
                  {filters.walletAddress && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('walletAddress', '');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <WalletAddressFilter
                  value={filters.walletAddress}
                  onChange={(value) => updateFilter('walletAddress', value)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Club Filter */}
            <AccordionItem value='club'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Club</span>
                  {filters.clubs.length > 0 && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('clubs', []);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {isLoadingOptions ? (
                  <div className='text-muted-foreground py-4 text-center text-xs'>
                    Loading clubs...
                  </div>
                ) : (
                  <InfiniteFilterCheckboxWithCounts
                    optionType='clubs'
                    selectedValues={filters.clubs}
                    onChange={(values) => updateFilter('clubs', values)}
                    placeholder='Search clubs...'
                    showSelectButtons={false}
                    counts={filterCounts?.clubs}
                    showCounts={!countsLoading}
                  />
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Best Position Filter */}
            <AccordionItem value='bestPosition'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Best Position</span>
                  {filters.bestPositions.length > 0 && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        updateFilter('bestPositions', []);
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterCheckboxWithCounts
                  options={ALL_POSITIONS}
                  selectedValues={filters.bestPositions}
                  onChange={(values) => updateFilter('bestPositions', values)}
                  placeholder='Search positions...'
                  showSelectButtons={false}
                  showSearch={false}
                  counts={filterCounts?.bestPositions}
                  showCounts={!countsLoading}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Best Overall Filter */}
            <AccordionItem value='bestOverall'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Best Overall</span>
                  {(filters.bestOverallMin !== null ||
                    filters.bestOverallMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('bestOverall');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.ratings.min}
                  max={DEFAULT_RANGES.ratings.max}
                  value={[
                    filters.bestOverallMin ?? DEFAULT_RANGES.ratings.min,
                    filters.bestOverallMax ?? DEFAULT_RANGES.ratings.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('bestOverall', value, [
                      DEFAULT_RANGES.ratings.min,
                      DEFAULT_RANGES.ratings.max,
                    ])
                  }
                />
              </AccordionContent>
            </AccordionItem>

            {/* Market Value Filter */}
            <AccordionItem value='marketValue'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Market Value</span>
                  {(filters.marketValueMin !== null ||
                    filters.marketValueMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('marketValue');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.marketValue.min}
                  max={DEFAULT_RANGES.marketValue.max}
                  value={[
                    filters.marketValueMin ?? DEFAULT_RANGES.marketValue.min,
                    filters.marketValueMax ?? DEFAULT_RANGES.marketValue.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('marketValue', value, [
                      DEFAULT_RANGES.marketValue.min,
                      DEFAULT_RANGES.marketValue.max,
                    ])
                  }
                  prefix='$'
                  showPrefixOnInputs={true}
                  infinityMax={true}
                />
              </AccordionContent>
            </AccordionItem>

            {/* Price Difference Filter */}
            <AccordionItem value='priceDiff'>
              <AccordionTrigger className='text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground text-sm/5 font-medium hover:no-underline'>
                <div className='flex w-full items-center justify-between'>
                  <span>Price Difference</span>
                  {(filters.priceDiffMin !== null ||
                    filters.priceDiffMax !== null) && (
                    <div
                      role='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSliderClear('priceDiff');
                      }}
                      className='hover:bg-accent ml-2 flex items-center gap-1 rounded-full pr-2 pl-3 text-xs/5'
                    >
                      {' '}
                      Clear
                      <X className='size-3' />
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <FilterSlider
                  min={DEFAULT_RANGES.priceDiff.min}
                  max={DEFAULT_RANGES.priceDiff.max}
                  value={[
                    filters.priceDiffMin ?? DEFAULT_RANGES.priceDiff.min,
                    filters.priceDiffMax ?? DEFAULT_RANGES.priceDiff.max,
                  ]}
                  onChange={(value) =>
                    handleSliderChange('priceDiff', value, [
                      DEFAULT_RANGES.priceDiff.min,
                      DEFAULT_RANGES.priceDiff.max,
                    ])
                  }
                  prefix='$'
                  showPrefixOnInputs={true}
                  infinityMax={true}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
