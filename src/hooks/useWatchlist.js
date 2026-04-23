import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTickerPrices } from '../services/marketData';

const STORAGE_KEY = 'watchlist';
const POLL_INTERVAL = 60_000; // 60 seconds

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map((item) => ({
      ...item,
      group: item.group || '',
    }));
  } catch {
    return [];
  }
}

function saveWatchlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Watchlist hook. Each item: { symbol, upperLimit, lowerLimit, group }.
 */
export default function useWatchlist() {
  const [items, setItems] = useState(loadWatchlist);
  const [prices, setPrices] = useState(new Map());

  useEffect(() => {
    saveWatchlist(items);
  }, [items]);

  const fetchPrices = useCallback(async () => {
    const symbols = items.map((i) => i.symbol);
    if (symbols.length === 0) {
      setPrices(new Map());
      return;
    }
    try {
      const data = await fetchTickerPrices(symbols);
      setPrices(data);
    } catch {
      // keep stale prices on error
    }
  }, [items]);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchPrices]);

  const addSymbol = useCallback((symbol) => {
    const upper = symbol.trim().toUpperCase();
    if (!upper) return;
    setItems((prev) => {
      if (prev.some((i) => i.symbol === upper)) return prev;
      return [...prev, { symbol: upper, upperLimit: '', lowerLimit: '', group: '' }];
    });
  }, []);

  const removeSymbol = useCallback((symbol) => {
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
  }, []);

  const updateLimits = useCallback((symbol, upperLimit, lowerLimit) => {
    setItems((prev) =>
      prev.map((i) =>
        i.symbol === symbol ? { ...i, upperLimit, lowerLimit } : i,
      ),
    );
  }, []);

  const updateGroup = useCallback((symbol, groupName) => {
    setItems((prev) =>
      prev.map((i) =>
        i.symbol === symbol ? { ...i, group: groupName || '' } : i,
      ),
    );
  }, []);

  const renameGroup = useCallback((oldName, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed || trimmed === oldName) return;
    setItems((prev) =>
      prev.map((i) => (i.group === oldName ? { ...i, group: trimmed } : i)),
    );
  }, []);

  const removeGroup = useCallback((groupName) => {
    setItems((prev) =>
      prev.map((i) => (i.group === groupName ? { ...i, group: '' } : i)),
    );
  }, []);

  const groups = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      if (i.group) set.add(i.group);
    });
    return [...set].sort();
  }, [items]);

  return {
    items,
    prices,
    groups,
    addSymbol,
    removeSymbol,
    updateLimits,
    updateGroup,
    renameGroup,
    removeGroup,
  };
}
