import './Sidebar.css';

function SignalItem({ signal }) {
  const icons = { bullish: '\u{1F7E2}', bearish: '\u{1F534}', neutral: '\u{1F535}' };
  return (
    <div className={`signal-item ${signal.type}`}>
      <div className="signal-title">
        {icons[signal.type]} {signal.title}
      </div>
      <div className="signal-desc">{signal.description}</div>
    </div>
  );
}

function MetricRow({ label, value, color }) {
  return (
    <div className="metric-row">
      <span className="metric-label">{label}</span>
      <span className="metric-value" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

function MiniChart({ children }) {
  return <div className="mini-chart">{children}</div>;
}

export default function Sidebar({ signals, trackRecord, positioning }) {
  return (
    <div className="sidebar">
      {/* Active Signals */}
      <div className="sidebar-panel">
        <h4 className="panel-title">Active Signals</h4>
        {signals.map((s) => (
          <SignalItem key={s.title} signal={s} />
        ))}
      </div>

      {/* Track Record */}
      <div className="sidebar-panel">
        <h4 className="panel-title">
          Track Record
          <span className="panel-subtitle">{trackRecord.period}</span>
        </h4>
        <MiniChart>{trackRecord.chartLabel}</MiniChart>
        {trackRecord.metrics.map((m) => (
          <MetricRow key={m.label} {...m} />
        ))}
      </div>

      {/* Current Positioning */}
      <div className="sidebar-panel">
        <h4 className="panel-title">Current Positioning</h4>
        <MiniChart>{positioning.chartLabel}</MiniChart>
        {positioning.metrics.map((m) => (
          <MetricRow key={m.label} {...m} />
        ))}
      </div>

      {/* Subscribe */}
      <div className="sidebar-panel">
        <h4 className="panel-title">Subscribe</h4>
        <p className="subscribe-desc">
          Weekly reports + real-time signals delivered to your inbox
        </p>
        <input
          type="email"
          placeholder="your@email.com"
          className="subscribe-input"
        />
        <button className="subscribe-btn">Subscribe Free</button>
      </div>
    </div>
  );
}
