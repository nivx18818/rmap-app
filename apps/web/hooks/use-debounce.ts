import * as React from 'react';

const DEFAULT_DEBOUNCE_DELAY = 300;

export function useDebounce<T>(value: T, delay = DEFAULT_DEBOUNCE_DELAY) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delay, value]);

  return debouncedValue;
}
