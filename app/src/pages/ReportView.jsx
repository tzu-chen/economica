import { useParams, Link } from 'react-router-dom';
import { useReports } from '../context/ReportsContext';
import './ReportView.css';

export default function ReportView() {
  const { id } = useParams();
  const { getReport } = useReports();
  const report = getReport(id);

  if (!report) {
    return (
      <div className="rv-not-found">
        <p>Report not found.</p>
        <Link to="/" className="rv-back">&larr; Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="report-view">
      <div className="rv-top-bar">
        <Link to="/" className="rv-back">&larr; Back to Home</Link>
        <Link to={`/write/${report.id}`} className="rv-edit-btn">Edit Report</Link>
      </div>

      <div className="rv-meta">
        <span>{report.date}</span>
        {report.category && (
          <>
            <span>&bull;</span>
            <span className="rv-category">{report.category}</span>
          </>
        )}
      </div>

      <h1 className="rv-title">{report.title}</h1>

      {report.tickers && report.tickers.length > 0 && (
        <div className="rv-chips">
          {report.tickers.map((ticker) => (
            <span key={ticker} className="rv-chip rv-chip-ticker">${ticker}</span>
          ))}
        </div>
      )}

      {report.tags && report.tags.length > 0 && (
        <div className="rv-chips">
          {report.tags.map((tag) => (
            <span key={tag} className="rv-chip">{tag}</span>
          ))}
        </div>
      )}

      <div
        className="rv-content"
        dangerouslySetInnerHTML={{ __html: report.content }}
      />

      {report.images && report.images.length > 0 && (
        <div className="rv-images">
          {report.images.map((img, i) => (
            <figure key={i} className="rv-figure">
              <img src={img.src} alt={img.caption || ''} />
              {img.caption && <figcaption>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
