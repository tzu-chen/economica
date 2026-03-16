import { useState, useEffect, useCallback } from 'react';
import { fetchTickerPrices } from '../services/marketData';

const STORAGE_KEY = 'watchlist';
const POLL_INTERVAL = 60_000; // 60 seconds

function loadWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Watchlist hook. Each item: { symbol, upperLimit, lowerLimit }.
 * Returns { items, prices, addSymbol, removeSymbol, updateLimits }.
 * prices is a Map<symbol, { price, changePercent }>.
 */
export default function useWatchlist() {
  const [items, setItems] = useState(loadWatchlist);
  const [prices, setPrices] = useState(new Map());

  // Persist on change
  useEffect(() => {
    saveWatchlist(items);
  }, [items]);

  // Fetch prices for all symbols
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
      return [...prev, { symbol: upper, upperLimit: '', lowerLimit: '' }];
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

  return { items, prices, addSymbol, removeSymbol, updateLimits };
}
