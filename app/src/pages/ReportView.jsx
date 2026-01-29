import { useParams, Link, useNavigate } from 'react-router-dom';
import { useReports } from '../context/ReportsContext';
import './ReportView.css';

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReport, archive } = useReports();
  const report = getReport(id);

  if (!report) {
    return (
      <div className="rv-not-found">
        <p>Report not found.</p>
        <Link to="/" className="rv-back">&larr; Back to Home</Link>
      </div>
    );
  }

  const handleArchive = () => {
    archive(report.id);
    navigate('/');
  };

  return (
    <div className="report-view">
      <div className="rv-top-bar">
        <Link to="/" className="rv-back">&larr; Back to Home</Link>
        <div className="rv-top-actions">
          <Link to={`/write/${report.id}`} className="rv-edit-btn">Edit Report</Link>
          {!report.archived && (
            <button className="rv-archive-btn" onClick={handleArchive}>
              Archive Report
            </button>
          )}
        </div>
      </div>

      <div className="rv-meta">
        <span>{report.date}</span>
        {report.category && (
          <>
            <span>&bull;</span>
            <span className="rv-category">{report.category}</span>
          </>
        )}
        {report.archived && <span className="rv-archived-badge">Archived</span>}
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
