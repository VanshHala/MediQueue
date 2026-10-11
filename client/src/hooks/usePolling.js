import { useEffect, useRef } from 'react';

/**
 * usePolling hook: repeatedly invokes a callback function at a given interval
 * @param {Function} callback - Async or sync polling function
 * @param {number} delay - Interval in milliseconds (default 10000ms = 10s)
 * @param {boolean} enabled - Whether polling is currently active
 */
export const usePolling = (callback, delay = 10000, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || delay === null) return;

    // Run immediately once
    savedCallback.current();

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay, enabled]);
};

export default usePolling;
