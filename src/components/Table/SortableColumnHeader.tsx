import { PlayerWithFavouriteData } from '@/types/global.types';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/solid';
import { Column } from '@tanstack/react-table';
import { Button } from '../UI/button';
import { cn } from '@/utils/helpers';

export function SortableColumnHeader({
  column,
  label,
}: {
  column: Column<PlayerWithFavouriteData>;
  label: string;
}) {
  return (
    <div className='-mx-1.5'>
      <Button
        variant='ghost'
        size='sm'
        className={cn(
          'flex w-full items-center justify-start gap-x-1 px-1.5',
          [
            'overall',
            'pace',
            'shooting',
            'passing',
            'dribbling',
            'defense',
            'physical',
          ].includes(column.id) && 'justify-center'
        )}
        onClick={column.getToggleSortingHandler()}
      >
        <span className='text-xs uppercase'>{label}</span>
        {/* {column.getIsSorted() === 'asc' && <ArrowDownIcon className='h-3 w-3' />}
      {column.getIsSorted() === 'desc' && <ArrowUpIcon className='h-3 w-3' />}
      {!column.getIsSorted() && <ChevronUpDownIcon className='h-4 w-4' />} */}
      </Button>
    </div>
  );
}
