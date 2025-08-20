import { SearchIcon, WalletIcon, XIcon } from 'lucide-react';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';
import { cn } from '@/utils/helpers';

interface WalletAddressFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function WalletAddressFilter({
  value,
  onChange,
  className,
}: WalletAddressFilterProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className='grid grid-cols-[auto_1fr_auto] items-center gap-2 overflow-visible'>
        <div className='bg-input/50 text-accent-foreground col-start-1 row-start-1 flex h-8 items-center justify-center rounded-l-md px-2.5'>
          <WalletIcon className='size-3' />
        </div>
        <Input
          placeholder='Enter wallet address...'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='col-span-3 col-start-1 row-start-1 h-8 px-10'
        />
        {value && (
          <div className='col-start-3 row-start-1 flex h-8 items-center justify-center rounded-r-md p-1.5'>
            <Button
              variant='ghost'
              size='icon'
              className='size-6'
              onClick={handleClear}
            >
              <XIcon className='size-3' />
              <span className='sr-only'>Clear wallet address</span>
            </Button>
          </div>
        )}
      </div>
      {value && (
        <div className='text-muted-foreground text-xs'>
          Filtering by: {value}
        </div>
      )}
    </div>
  );
}
