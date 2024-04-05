import { useState, useEffect } from "react";
import { useDebounceValue } from "usehooks-ts";

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}) {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounceValue<string>(value, debounce);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    onChange(value);
  }, [debouncedValue]);

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}
