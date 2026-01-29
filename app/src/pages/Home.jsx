import { Link } from 'react-router-dom';
import DataStrip from '../components/DataStrip';
import FeaturedChart from '../components/FeaturedChart';
import ReportCard from '../components/ReportCard';
import Sidebar from '../components/Sidebar';
import { useReports } from '../context/ReportsContext';
import useMarketData from '../hooks/useMarketData';
import {
  signals,
  trackRecord,
  positioning,
} from '../data/mockData';

export default function Home() {
  const { activeReports, archive } = useReports();
  const { metrics, lastUpdate } = useMarketData();

  return (
    <>
      <DataStrip metrics={metrics} lastUpdate={lastUpdate} />
      <FeaturedChart />
      <div className="main-content">
        <div className="reports-section">
          {activeReports.length > 0 ? (
            activeReports.map((report, i) => (
              <ReportCard key={report.title + i} report={report} onArchive={archive} />
            ))
          ) : (
            <div className="empty-reports">
              <p>No reports published yet.</p>
              <Link to="/write" className="empty-reports-link">
                Write your first report
              </Link>
            </div>
          )}
        </div>
        <Sidebar
          signals={signals}
          trackRecord={trackRecord}
          positioning={positioning}
        />
      </div>
    </>
  );
}
