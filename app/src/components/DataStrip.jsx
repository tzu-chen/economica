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
          <div className="data-label">{m.label}</div>
          <div className={`data-value ${m.status}`}>
            {m.value}
            {m.change && <span className="data-change"> {m.change}</span>}
          </div>
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
