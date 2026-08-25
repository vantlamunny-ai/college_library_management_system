import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic data-fetching hook wrapping a service call with loading/error/data
 * state. `fetcher` must be stable across renders that shouldn't refetch —
 * pass a useCallback, or rely on the deps array like useEffect.
 *
 * @param {() => Promise<{data:any, count?:number}>} fetcher
 * @param {any[]} deps
 * @param {{enabled?: boolean}} [options]
 */
export function useApi(fetcher, deps = [], options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(null);
  const [count, setCount] = useState(undefined);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(() => {
    if (!enabled) return;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (id !== requestId.current) return;
        setData(res?.data ?? null);
        setCount(res?.count);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err);
      })
      .finally(() => {
        if (id !== requestId.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps -- deps is intentionally a caller-supplied array, not a literal
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, count, loading, error, refetch: load };
}

/**
 * Wraps an async mutation (create/update/delete) with loading/error state
 * for forms and action buttons. Returns [run, {loading, error}].
 */
export function useMutation(mutationFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await mutationFn(...args);
        return res;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return [run, { loading, error }];
}
