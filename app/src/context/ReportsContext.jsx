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
      const withId = { ...report, id: report.id || crypto.randomUUID() };
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

  const getReport = useCallback(
    (id) => reports.find((r) => r.id === id) || null,
    [reports],
  );

  return (
    <ReportsContext.Provider value={{ reports, publish, update, getReport }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
