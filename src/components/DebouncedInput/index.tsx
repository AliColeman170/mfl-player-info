import { InputHTMLAttributes } from 'react';
import { useDebounceValue } from 'usehooks-ts';

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onChange: (v: string) => void;
  debounce?: number;
}) {
  const [value, setValue] = useDebounceValue<string>(initialValue, debounce);

  return (
    <input
      {...props}
      defaultValue={value}
      onChange={(e) => {
        setValue(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}
