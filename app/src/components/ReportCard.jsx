import { Link } from 'react-router-dom';
import './ReportCard.css';

export default function ReportCard({ report }) {
  const card = (
    <div className="report-card">
      <div className="report-main">
        <div className="report-meta">
          <span>{report.date}</span>
          {report.category && (
            <>
              <span>&bull;</span>
              <span className="report-category">{report.category}</span>
            </>
          )}
        </div>
        <h3 className="report-title">{report.title}</h3>
        {report.excerpt && <p className="report-excerpt">{report.excerpt}</p>}
        {report.tags && report.tags.length > 0 && (
          <div className="report-tags">
            {report.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        {report.tickers && report.tickers.length > 0 && (
          <div className="report-tags" style={{ marginTop: 6 }}>
            {report.tickers.map((ticker) => (
              <span key={ticker} className="tag tag-ticker">
                ${ticker}
              </span>
            ))}
          </div>
        )}
      </div>
      {report.chartLabel && (
        <div className="report-chart">
          {report.chartLabel}
          <br />
          <br />
          {report.chartNote}
        </div>
      )}
    </div>
  );

  if (report.id) {
    return (
      <Link to={`/report/${report.id}`} className="report-card-link">
        {card}
      </Link>
    );
  }

  return card;
}
