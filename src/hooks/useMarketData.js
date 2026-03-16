import { useState, useEffect, useRef } from 'react';
import { fetchMarketMetrics } from '../services/marketData';
import { marketMetrics as fallbackMetrics } from '../data/mockData';

const REFRESH_INTERVAL = 60_000; // 60 seconds

export default function useMarketData() {
  const [metrics, setMetrics] = useState(fallbackMetrics);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchMarketMetrics();
        if (!cancelled) {
          setMetrics(data);
          setLastUpdate(new Date());
        }
      } catch {
        // keep previous / fallback data
      }
    }

    load();
    timerRef.current = setInterval(load, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, []);

  return { metrics, lastUpdate };
}
