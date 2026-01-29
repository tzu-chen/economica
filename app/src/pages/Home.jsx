import { Link } from 'react-router-dom';
import DataStrip from '../components/DataStrip';
import FeaturedChart from '../components/FeaturedChart';
import ReportCard from '../components/ReportCard';
import Sidebar from '../components/Sidebar';
import { useReports } from '../context/ReportsContext';
import {
  marketMetrics,
  signals,
  trackRecord,
  positioning,
} from '../data/mockData';

export default function Home() {
  const { activeReports } = useReports();

  return (
    <>
      <DataStrip metrics={marketMetrics} />
      <FeaturedChart />
      <div className="main-content">
        <div className="reports-section">
          {activeReports.length > 0 ? (
            activeReports.map((report, i) => (
              <ReportCard key={report.title + i} report={report} />
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
