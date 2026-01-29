import './ReportCard.css';

export default function ReportCard({ report }) {
  return (
    <div className="report-card">
      <div className="report-main">
        <div className="report-meta">
          <span>{report.date}</span>
          <span>&bull;</span>
          <span className="report-category">{report.category}</span>
        </div>
        <h3 className="report-title">{report.title}</h3>
        <p className="report-excerpt">{report.excerpt}</p>
        <div className="report-tags">
          {report.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="report-chart">
        {report.chartLabel}
        <br />
        <br />
        {report.chartNote}
      </div>
    </div>
  );
}
