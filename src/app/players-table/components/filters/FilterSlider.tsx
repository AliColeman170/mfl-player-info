import { Label } from '@/components/UI/label';
import { Slider } from '@/components/UI/slider';
import { InputWithAddons } from './InputWithAddons';

interface FilterSliderProps {
  min?: number;
  max?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  suffix?: string;
  prefix?: string;
  step?: number;
  showSuffixOnInputs?: boolean;
  showPrefixOnInputs?: boolean;
  infinityMax?: boolean; // Show 3000+ when max value is at maximum
  infinityMin?: boolean; // Show <-3000 when min value is at minimum
}

export function FilterSlider({
  min = 0,
  max = 100,
  value,
  onChange,
  suffix = '',
  prefix = '',
  step = 1,
  showSuffixOnInputs = false,
  showPrefixOnInputs = false,
  infinityMax = false,
  infinityMin = false,
}: FilterSliderProps) {
  const handleMinInputChange = (inputValue: string) => {
    // Handle <-3000 symbol
    if (infinityMin && inputValue === '<-3000') {
      onChange([min, value[1]]);
      return;
    }
    
    const num = parseInt(inputValue);
    if (!isNaN(num) && num >= min && num <= value[1]) {
      onChange([num, value[1]]);
    }
  };

  const handleMaxInputChange = (inputValue: string) => {
    // Handle >3000 symbol for price diff
    if (infinityMax && inputValue === '>3000') {
      onChange([value[0], max]);
      return;
    }
    // Handle 3000+ symbol for market value
    if (infinityMax && inputValue === '3000+') {
      onChange([value[0], max]);
      return;
    }
    
    const num = parseInt(inputValue);
    if (!isNaN(num) && num <= max && num >= value[0]) {
      onChange([value[0], num]);
    }
  };

  // Display values for inputs
  const minDisplayValue = infinityMin && value[0] === min ? '<-3000' : value[0];
  const maxDisplayValue = infinityMax && value[1] === max ? '3000+' : value[1];

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs'>Min.</Label>
            <InputWithAddons
              value={minDisplayValue}
              onChange={handleMinInputChange}
              min={min}
              max={value[1]}
              className={
                (showSuffixOnInputs && suffix) || (showPrefixOnInputs && prefix) 
                  ? 'w-28' 
                  : 'w-18'
              }
              suffix={showSuffixOnInputs ? suffix : undefined}
              prefix={showPrefixOnInputs ? prefix : undefined}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <Label className='text-muted-foreground text-xs'>Max.</Label>
            <InputWithAddons
              value={maxDisplayValue}
              onChange={handleMaxInputChange}
              min={value[0]}
              max={max}
              className={
                (showSuffixOnInputs && suffix) || (showPrefixOnInputs && prefix) 
                  ? 'w-28' 
                  : 'w-18'
              }
              suffix={showSuffixOnInputs ? suffix : undefined}
              prefix={showPrefixOnInputs ? prefix : undefined}
            />
          </div>
          {prefix && !showPrefixOnInputs && (
            <span className='text-muted-foreground bg-muted self-end pb-2 text-xs'>
              {prefix}
            </span>
          )}
          {suffix && !showSuffixOnInputs && (
            <span className='text-muted-foreground bg-muted self-end pb-2 text-xs'>
              {suffix}
            </span>
          )}
        </div>

        <Slider
          value={value}
          onValueChange={onChange}
          min={min}
          max={max}
          step={step}
          className='w-full'
        />
      </div>
    </div>
  );
}
