import { useState, useMemo, useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'monthlyPnl';
const NOTES_KEY = 'pnlNotes';

function loadPnlData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePnlData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('pnl-updated'));
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// Subscribe to PnL changes across components
let snapshotCache = loadPnlData();

function subscribe(cb) {
  const handler = () => {
    snapshotCache = loadPnlData();
    cb();
  };
  window.addEventListener('pnl-updated', handler);
  return () => window.removeEventListener('pnl-updated', handler);
}

function getSnapshot() {
  return snapshotCache;
}

/**
 * Hook for reading PnL data reactively across components.
 * Returns the full PnL data object (read-only).
 */
export function usePnlSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Build a daily equity curve from PnL data.
 * Returns array of { date, equity, dailyPnl } sorted chronologically.
 * Only months that have a _balance are included.
 */
export function useEquityCurve(pnlData) {
  return useMemo(() => {
    const points = [];
    const monthKeys = Object.keys(pnlData).sort();

    for (const mk of monthKeys) {
      const monthEntry = pnlData[mk];
      const balance = monthEntry._balance;
      if (balance === undefined || balance === null) continue;

      const [y, m] = mk.split('-').map(Number);
      const year = y;
      const month = m - 1; // 0-indexed
      const daysInMonth = getDaysInMonth(year, month);
      let runningEquity = balance;

      for (let d = 1; d <= daysInMonth; d++) {
        const dailyPnl = monthEntry[d];
        if (dailyPnl !== undefined && dailyPnl !== null && dailyPnl !== '') {
          runningEquity += Number(dailyPnl);
        }
        // Only add a point if this day has PnL data, or it's day 1 (starting balance)
        if (d === 1 || (dailyPnl !== undefined && dailyPnl !== null && dailyPnl !== '')) {
          points.push({
            date: new Date(year, month, d),
            equity: runningEquity,
            dailyPnl: d === 1 && (dailyPnl === undefined || dailyPnl === null) ? 0 : Number(dailyPnl || 0),
          });
        }
      }
    }

    return points;
  }, [pnlData]);
}

function loadPnlNotes() {
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePnlNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function exportPnlData() {
  const data = loadPnlData();
  const notes = loadPnlNotes();
  const payload = { pnlData: data, pnlNotes: notes, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pnl-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importPnlData() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const payload = JSON.parse(ev.target.result);
          if (!payload.pnlData || typeof payload.pnlData !== 'object') {
            reject(new Error('Invalid file: missing pnlData'));
            return;
          }
          savePnlData(payload.pnlData);
          if (payload.pnlNotes && typeof payload.pnlNotes === 'object') {
            savePnlNotes(payload.pnlNotes);
          }
          resolve(payload);
        } catch (err) {
          reject(new Error('Failed to parse file: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    };
    input.click();
  });
}

export { loadPnlData, savePnlData, getDaysInMonth, getMonthKey, loadPnlNotes, savePnlNotes, exportPnlData, importPnlData, STORAGE_KEY };
