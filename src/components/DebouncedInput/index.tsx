import { useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = useDebounceValue<string>(initialValue, debounce);

  useEffect(() => {
    onChange(value);
  }, [value, onChange]);

  return (
    <input
      {...props}
      defaultValue={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
