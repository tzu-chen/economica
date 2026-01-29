import { createContext, useContext, useState, useCallback } from 'react';

const ReportsContext = createContext(null);

export function ReportsProvider({ children }) {
  const [reports, setReports] = useState(() => {
    try {
      const stored = localStorage.getItem('publishedReports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const persist = (next) => {
    localStorage.setItem('publishedReports', JSON.stringify(next));
  };

  const publish = useCallback((report) => {
    setReports((prev) => {
      const withId = { ...report, id: report.id || crypto.randomUUID(), archived: false };
      const next = [withId, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const update = useCallback((id, updated) => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updated } : r));
      persist(next);
      return next;
    });
  }, []);

  const archive = useCallback((id) => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, archived: true } : r));
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const getReport = useCallback(
    (id) => reports.find((r) => r.id === id) || null,
    [reports],
  );

  const activeReports = reports.filter((r) => !r.archived);
  const archivedReports = reports.filter((r) => r.archived);

  return (
    <ReportsContext.Provider
      value={{ reports, activeReports, archivedReports, publish, update, archive, remove, getReport }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
