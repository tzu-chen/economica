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

  const publish = useCallback((report) => {
    setReports((prev) => {
      const next = [report, ...prev];
      localStorage.setItem('publishedReports', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <ReportsContext.Provider value={{ reports, publish }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
