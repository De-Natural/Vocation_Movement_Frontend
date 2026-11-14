"use client";

import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { ApiError } from "./api-client";

/** Human-readable message for a failed API call. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  if (err instanceof ApiError && err.status === 0) return "Can't reach the server. Please try again.";
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Fetch data from the API on mount (and whenever `deps` change).
 * `reload()` re-runs the fetch without clearing the current data, so
 * screens don't flash a skeleton after every mutation.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  // Ignore responses from superseded requests (e.g. fast filter changes).
  const callId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++callId.current;
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (id === callId.current) setData(result);
    } catch (err) {
      if (id === callId.current) setError(apiErrorMessage(err));
    } finally {
      if (id === callId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload, setData };
}
