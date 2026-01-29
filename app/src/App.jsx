import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReportsProvider } from './context/ReportsContext';
import Header from './components/Header';
import Home from './pages/Home';
import ReportWriter from './pages/ReportWriter';

export default function App() {
  return (
    <BrowserRouter>
      <ReportsProvider>
        <div className="container">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/write" element={<ReportWriter />} />
          </Routes>
        </div>
      </ReportsProvider>
    </BrowserRouter>
  );
}
