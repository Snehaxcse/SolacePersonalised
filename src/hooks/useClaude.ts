import { useState, useCallback } from 'react';

export function useClaude<T>(
  fn: (...args: any[]) => Promise<T>,
  fallback: T
): { data: T | null; loading: boolean; call: (...args: any[]) => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const call = useCallback(async (...args: any[]) => {
    setLoading(true);
    try {
      const result = await fn(...args);
      setData(result);
    } catch {
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [fn, fallback]);

  return { data, loading, call };
}
