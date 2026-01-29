import { Link } from 'react-router-dom';
import useTickerQuotes from '../hooks/useTickerQuotes';
import './ReportCard.css';

function TickerChange({ value }) {
  if (value == null) return null;
  const sign = value >= 0 ? '+' : '';
  const cls = value >= 0 ? 'ticker-change-up' : 'ticker-change-down';
  return <span className={`ticker-change ${cls}`}>{sign}{value.toFixed(1)}%</span>;
}

export default function ReportCard({ report, onArchive, onDelete }) {
  const tickerChanges = useTickerQuotes(report.tickers);
  const handleAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    action(report.id);
  };

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
                <TickerChange value={tickerChanges.get(ticker)} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="report-actions">
        {onArchive && (
          <button
            className="report-action-btn report-action-archive"
            title="Archive report"
            onClick={(e) => handleAction(e, onArchive)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="14" height="4" rx="1" />
              <path d="M2 5v8a1 1 0 001 1h10a1 1 0 001-1V5" />
              <path d="M6 8h4" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            className="report-action-btn report-action-delete"
            title="Delete report"
            onClick={(e) => handleAction(e, onDelete)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4h12" />
              <path d="M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4" />
              <path d="M12.5 4l-.5 9.5a1 1 0 01-1 .5H5a1 1 0 01-1-.5L3.5 4" />
              <path d="M6.5 7v4" />
              <path d="M9.5 7v4" />
            </svg>
          </button>
        )}
        {report.chartLabel && (
          <div className="report-chart">
            {report.chartLabel}
            <br />
            <br />
            {report.chartNote}
          </div>
        )}
      </div>
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
