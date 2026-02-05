import './DataStrip.css';

export default function DataStrip({ metrics, lastUpdate }) {
  const displayTime = (lastUpdate || new Date()).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });

  return (
    <div className="data-strip">
      {metrics.map((m) => (
        <div className="data-metric" key={m.label}>
          <span className="data-label">{m.label}</span>
          <span className="data-value">{m.value}</span>
          {m.change && (
            <span className={`data-change ${m.status}`}>
              {m.change}
              {m.status === 'positive' && <span className="data-arrow positive">&#9650;</span>}
              {m.status === 'negative' && <span className="data-arrow negative">&#9660;</span>}
            </span>
          )}
        </div>
      ))}
      <div className="data-metric">
        <div className="data-label">Last Update</div>
        <div className="data-value last-update">
          {displayTime} EST
        </div>
      </div>
    </div>
  );
}
