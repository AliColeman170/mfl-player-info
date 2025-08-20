import { Heart, HeartOff, Users } from 'lucide-react';
import { Button } from '@/components/UI/button';
import { cn } from '@/utils/helpers';

type FavouriteFilter = 'all' | 'favourites' | 'non-favourites';

interface FavouriteToggleProps {
  value: FavouriteFilter;
  onChange: (value: FavouriteFilter) => void;
  className?: string;
}

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Players', icon: Users },
  { value: 'favourites' as const, label: 'Favourites', icon: Heart },
  { value: 'non-favourites' as const, label: 'Non-Favourites', icon: HeartOff },
];

export function FavouriteToggle({
  value,
  onChange,
  className,
}: FavouriteToggleProps) {
  const currentIndex = FILTER_OPTIONS.findIndex(
    (option) => option.value === value
  );

  const handleClick = () => {
    const nextIndex = (currentIndex + 1) % FILTER_OPTIONS.length;
    onChange(FILTER_OPTIONS[nextIndex].value);
  };

  const currentOption = FILTER_OPTIONS[currentIndex];
  const Icon = currentOption.icon;

  return (
    <Button
      variant={value === 'all' ? 'outline' : 'default'}
      size='sm'
      onClick={handleClick}
      className={cn(
        'h-10 gap-2 px-3 transition-colors',
        value === 'favourites' &&
          'border-red-500 bg-red-500 fill-red-500 text-white hover:bg-red-600',
        value === 'non-favourites' &&
          'border-gray-500 bg-gray-500 text-white hover:bg-gray-600',
        className
      )}
    >
      <Icon
        className={cn('size-4', value === 'favourites' && 'fill-red-500')}
      />
      <span className='hidden sm:inline'>{currentOption.label}</span>
    </Button>
  );
}
