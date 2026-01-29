import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReportsProvider } from './context/ReportsContext';
import Header from './components/Header';
import Home from './pages/Home';
import ReportWriter from './pages/ReportWriter';
import ReportView from './pages/ReportView';
import Archive from './pages/Archive';

export default function App() {
  return (
    <BrowserRouter>
      <ReportsProvider>
        <div className="container">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/write" element={<ReportWriter />} />
            <Route path="/write/:id" element={<ReportWriter />} />
            <Route path="/report/:id" element={<ReportView />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
        </div>
      </ReportsProvider>
    </BrowserRouter>
  );
}
