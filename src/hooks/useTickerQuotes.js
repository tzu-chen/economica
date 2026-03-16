import { useState, useEffect } from 'react';
import { fetchTickerChanges } from '../services/marketData';

const CACHE_TTL = 5 * 60_000; // 5 minutes
const cache = { data: new Map(), timestamp: 0 };

/**
 * Returns a Map<symbol, number> of today's % change for the given tickers.
 * Results are cached globally for 5 minutes to avoid redundant fetches.
 */
export default function useTickerQuotes(tickers) {
  const [changes, setChanges] = useState(new Map());
  const tickerKey = tickers && tickers.length > 0 ? tickers.slice().sort().join(',') : '';

  useEffect(() => {
    if (!tickerKey) return;

    let cancelled = false;
    const symbols = tickerKey.split(',');

    async function load() {
      const now = Date.now();
      const allCached =
        now - cache.timestamp < CACHE_TTL &&
        symbols.every((t) => cache.data.has(t));

      if (allCached) {
        const result = new Map();
        symbols.forEach((t) => result.set(t, cache.data.get(t)));
        if (!cancelled) setChanges(result);
        return;
      }

      try {
        const missing = symbols.filter(
          (t) => !(now - cache.timestamp < CACHE_TTL && cache.data.has(t)),
        );

        if (missing.length > 0) {
          const fetched = await fetchTickerChanges(missing);
          fetched.forEach((v, k) => cache.data.set(k, v));
          cache.timestamp = Date.now();
        }

        if (!cancelled) {
          const result = new Map();
          symbols.forEach((t) => {
            if (cache.data.has(t)) result.set(t, cache.data.get(t));
          });
          setChanges(result);
        }
      } catch {
        // leave changes empty on error
      }
    }

    load();

    return () => { cancelled = true; };
  }, [tickerKey]);

  return changes;
}
