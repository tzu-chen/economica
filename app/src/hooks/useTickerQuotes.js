import { useState, useEffect, useRef } from 'react';
import { fetchTickerChanges } from '../services/marketData';

const CACHE_TTL = 5 * 60_000; // 5 minutes
const cache = { data: new Map(), timestamp: 0, pending: null };

/**
 * Returns a Map<symbol, number> of today's % change for the given tickers.
 * Results are cached globally for 5 minutes to avoid redundant fetches.
 */
export default function useTickerQuotes(tickers) {
  const [changes, setChanges] = useState(new Map());
  const tickerKey = tickers && tickers.length > 0 ? tickers.slice().sort().join(',') : '';
  const prevKey = useRef('');

  useEffect(() => {
    if (!tickerKey) return;

    let cancelled = false;

    async function load() {
      // Check if all requested tickers are already cached and fresh
      const now = Date.now();
      const allCached =
        now - cache.timestamp < CACHE_TTL &&
        tickers.every((t) => cache.data.has(t));

      if (allCached) {
        const result = new Map();
        tickers.forEach((t) => result.set(t, cache.data.get(t)));
        if (!cancelled) setChanges(result);
        return;
      }

      try {
        // Fetch only the tickers we don't have cached
        const missing = tickers.filter(
          (t) => !(now - cache.timestamp < CACHE_TTL && cache.data.has(t)),
        );

        if (missing.length > 0) {
          // Deduplicate concurrent requests for the same set
          const fetched = await fetchTickerChanges(missing);
          fetched.forEach((v, k) => cache.data.set(k, v));
          cache.timestamp = now;
        }

        if (!cancelled) {
          const result = new Map();
          tickers.forEach((t) => {
            if (cache.data.has(t)) result.set(t, cache.data.get(t));
          });
          setChanges(result);
        }
      } catch {
        // leave changes empty on error
      }
    }

    // Only refetch when tickers actually change
    if (tickerKey !== prevKey.current) {
      prevKey.current = tickerKey;
      load();
    }
  }, [tickerKey, tickers]);

  return changes;
}
