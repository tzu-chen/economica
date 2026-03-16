import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReportsProvider } from './context/ReportsContext';
import DataStrip from './components/DataStrip';
import Header from './components/Header';
import Home from './pages/Home';
import ReportWriter from './pages/ReportWriter';
import ReportView from './pages/ReportView';
import Archive from './pages/Archive';
import Links from './pages/Links';
import Pnl from './pages/Pnl';
import useMarketData from './hooks/useMarketData';

function AppContent() {
  const { metrics, lastUpdate } = useMarketData();

  return (
    <>
      <DataStrip metrics={metrics} lastUpdate={lastUpdate} />
      <div className="container">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/write" element={<ReportWriter />} />
          <Route path="/write/:id" element={<ReportWriter />} />
          <Route path="/report/:id" element={<ReportView />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/links" element={<Links />} />
          <Route path="/pnl" element={<Pnl />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ReportsProvider>
        <AppContent />
      </ReportsProvider>
    </BrowserRouter>
  );
}
