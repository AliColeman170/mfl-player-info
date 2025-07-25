import { useMemo } from 'react';
import { FilterCheckbox } from './FilterCheckbox';

interface FilterCheckboxWithCountsProps {
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxHeight?: string;
  formatLabel?: (value: string) => string;
  renderIcon?: (value: string) => React.ReactNode;
  showSelectButtons?: boolean;
  showSearch?: boolean;
  // New props for counts
  counts?: Record<string, number>;
  showCounts?: boolean;
}

export function FilterCheckboxWithCounts({
  options,
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
}: FilterCheckboxWithCountsProps) {
  // Function to get count for each option
  const getCount = useMemo(() => {
    if (!showCounts || !counts) return undefined;

    return (value: string) => counts[value];
  }, [counts, showCounts]);

  return (
    <FilterCheckbox
      options={options}
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
