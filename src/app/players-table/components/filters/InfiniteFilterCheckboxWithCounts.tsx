'use client';

import { useMemo } from 'react';
import { InfiniteFilterCheckbox } from './InfiniteFilterCheckbox';

interface InfiniteFilterCheckboxWithCountsProps {
  optionType: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxHeight?: string;
  formatLabel?: (value: string) => string;
  renderIcon?: (value: string) => React.ReactNode;
  showSelectButtons?: boolean;
  showSearch?: boolean;
  // Props for counts
  counts?: Record<string, number>;
  showCounts?: boolean;
}

export function InfiniteFilterCheckboxWithCounts({
  optionType,
  selectedValues,
  onChange,
  placeholder,
  maxHeight,
  formatLabel,
  renderIcon,
  showSelectButtons = true,
  showSearch = true,
  counts,
  showCounts = true,
  ...props
}: InfiniteFilterCheckboxWithCountsProps) {
  // Function to get count for each option
  const getCount = useMemo(() => {
    if (!showCounts || !counts) return undefined;
    
    return (value: string) => counts[value];
  }, [counts, showCounts]);

  return (
    <InfiniteFilterCheckbox
      optionType={optionType}
      selectedValues={selectedValues}
      onChange={onChange}
      placeholder={placeholder}
      maxHeight={maxHeight}
      formatLabel={formatLabel}
      getCount={getCount}
      renderIcon={renderIcon}
      showSelectButtons={showSelectButtons}
      showSearch={showSearch}
      {...props}
    />
  );
}