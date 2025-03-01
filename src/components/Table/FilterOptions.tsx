import { cn } from '@/utils/helpers';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { Button } from '../UI/Button';

export function FilterOptions({
  count,
  handleClick,
  className,
}: {
  count: number;
  handleClick: () => void;
  className?: string;
}) {
  return (
    <div className={cn(`relative`, className)}>
      <Button onClick={() => handleClick()} size='lg'>
        <FunnelIcon className='size-5' aria-hidden='true' />
        Advanced
      </Button>
      {count > 0 && (
        <div className='absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white'>
          {count}
        </div>
      )}
    </div>
  );
}
