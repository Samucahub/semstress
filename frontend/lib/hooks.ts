import { useEffect, useRef } from 'react';

export function useOnceEffect(effect: () => void | (() => void)) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      return effect();
    }
  }, [effect]);
}

export function useFetch<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  onSuccess: (data: T) => void,
  onError: (error: Error) => void,
  dependencies?: any[],
) {
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    fetchFn(controller.signal)
      .then((data) => {
        if (isMounted) {
          onSuccess(data);
        }
      })
      .catch((error) => {
        if (isMounted && !error.name.includes('AbortError')) {
          onError(error);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, dependencies);
}
