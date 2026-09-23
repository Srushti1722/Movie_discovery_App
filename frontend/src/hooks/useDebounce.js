import { useState, useEffect } from 'react';

/**
 * Custom Hook: useDebounce
 *
 * Delays the updating of a value until after `delay` milliseconds have passed
 * since the last time the value changed.
 *
 * @param {any} value - The value to debounce
 * @param {number} delay - Milliseconds to delay
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer to update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function runs on every re-render BEFORE the next effect runs.
    // If the user types another letter before the timer finishes, it cancels
    // the previous timer, preventing the update.
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
