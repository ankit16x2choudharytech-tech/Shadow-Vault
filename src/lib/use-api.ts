"use client";

import { useEffect, useState } from "react";

// Simple module-level cache to avoid refetching on every mount
const cache = new Map<string, unknown>();

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  url: string | null;
}

/**
 * Lightweight data-fetching hook with in-memory cache.
 * All setState calls happen inside async callbacks (never synchronous in the
 * effect body) to satisfy the React Compiler set-state-in-effect rule.
 */
export function useApi<T>(url: string | null) {
  const [state, setState] = useState<ApiState<T>>(() => {
    if (!url) return { data: null, loading: false, error: null, url };
    const cached = (cache.get(url) as T | null) ?? null;
    return { data: cached, loading: !cached, error: null, url };
  });

  useEffect(() => {
    if (!url) return;
    let active = true;

    const promise = cache.has(url)
      ? Promise.resolve(cache.get(url) as T)
      : fetch(url).then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const json = await r.json();
          const payload = (json.data ?? json) as T;
          cache.set(url, payload);
          return payload;
        });

    promise
      .then((payload) => {
        if (active)
          setState({ data: payload, loading: false, error: null, url });
      })
      .catch((e: unknown) => {
        if (active)
          setState({
            data: null,
            loading: false,
            error: (e as Error)?.message ?? "Failed to load",
            url,
          });
      });

    return () => {
      active = false;
    };
  }, [url]);

  // Derive current view from state, accounting for url changes / cache hits
  const cached = url ? (cache.get(url) as T | null) ?? null : null;
  const isCurrent = url === state.url;
  const data = isCurrent ? state.data : cached;
  const loading = url ? (isCurrent ? state.loading : !cached) : false;
  const error = isCurrent ? state.error : null;

  const refresh = () => {
    if (url) cache.delete(url);
  };

  return { data, loading, error, refresh };
}

export function invalidateCache(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}
