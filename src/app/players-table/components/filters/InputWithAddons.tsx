import { Input } from '@/components/UI/input';
import { cn } from '@/utils/helpers';

interface InputWithAddonsProps {
  value: number | string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  placeholder?: string;
}

export function InputWithAddons({
  value,
  onChange,
  min,
  max,
  className,
  suffix,
  prefix,
  placeholder,
}: InputWithAddonsProps) {
  return (
    <div className={cn('relative flex', className)}>
      {prefix && (
        <div className='bg-input pointer-events-none absolute inset-y-0 left-0 flex items-center rounded-l-md px-3'>
          <span className='text-accent-foreground text-xs'>{prefix}</span>
        </div>
      )}
      <Input
        type={typeof value === 'string' ? 'text' : 'number'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={typeof value === 'number' ? min : undefined}
        max={typeof value === 'number' ? max : undefined}
        placeholder={placeholder}
        className={cn(
          'h-8 text-xs',
          prefix && 'pl-10', // Add more padding for prefix
          suffix && 'pr-10' // Add more padding for suffix
        )}
      />
      {suffix && (
        <div className='bg-input pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-md px-2'>
          <span className='text-accent-foreground text-xs'>{suffix}</span>
        </div>
      )}
    </div>
  );
}
