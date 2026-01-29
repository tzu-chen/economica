import DataStrip from '../components/DataStrip';
import FeaturedChart from '../components/FeaturedChart';
import ReportCard from '../components/ReportCard';
import Sidebar from '../components/Sidebar';
import {
  marketMetrics,
  reports,
  signals,
  trackRecord,
  positioning,
} from '../data/mockData';

export default function Home() {
  return (
    <>
      <DataStrip metrics={marketMetrics} />
      <FeaturedChart />
      <div className="main-content">
        <div className="reports-section">
          {reports.map((report) => (
            <ReportCard key={report.title} report={report} />
          ))}
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
