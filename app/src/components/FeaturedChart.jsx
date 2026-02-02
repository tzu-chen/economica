import { useState, useMemo, useEffect } from 'react';
import { usePnlSnapshot, useEquityCurve } from '../hooks/usePnlData';
import { fetchSPHistory } from '../services/marketData';
import './FeaturedChart.css';

const TIME_RANGES = ['1M', '3M', 'YTD', '1Y', 'All'];

function rangeToYahoo(range) {
  switch (range) {
    case '1M': return '3mo';
    case '3M': return '6mo';
    case 'YTD': return '1y';
    case '1Y': return '2y';
    default: return '5y';
  }
}

function filterByRange(points, range) {
  if (!points.length) return points;
  const now = new Date();
  let cutoff;
  switch (range) {
    case '1M':
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case '3M':
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case 'YTD':
      cutoff = new Date(now.getFullYear(), 0, 1);
      break;
    case '1Y':
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      return points;
  }
  const filtered = points.filter((p) => p.date >= cutoff);
  return filtered.length ? filtered : points;
}

function formatDate(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
}

function formatCurrency(val) {
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toLocaleString();
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const VB_W = 800;
const VB_H = 340;
const PAD = { top: 24, right: 24, bottom: 36, left: 72 };

export default function FeaturedChart() {
  const [activeRange, setActiveRange] = useState('3M');
  const [hoverIdx, setHoverIdx] = useState(null);
  const [spRaw, setSpRaw] = useState([]);

  const pnlData = usePnlSnapshot();
  const allPoints = useEquityCurve(pnlData);
  const points = useMemo(() => filterByRange(allPoints, activeRange), [allPoints, activeRange]);

  const hasData = points.length > 1;

  // Fetch S&P history when range changes
  useEffect(() => {
    let cancelled = false;
    fetchSPHistory(rangeToYahoo(activeRange))
      .then((data) => { if (!cancelled) setSpRaw(data); })
      .catch(() => { if (!cancelled) setSpRaw([]); });
    return () => { cancelled = true; };
  }, [activeRange]);

  // Build S&P % return series aligned to the portfolio date range
  const spSeries = useMemo(() => {
    if (!hasData || !spRaw.length) return [];
    const startDate = points[0].date;
    // Find S&P close on or just before the portfolio start date
    const startKey = dateKey(startDate);
    let baseIdx = -1;
    for (let i = 0; i < spRaw.length; i++) {
      if (dateKey(spRaw[i].date) <= startKey) baseIdx = i;
    }
    if (baseIdx < 0) baseIdx = 0;
    const baseClose = spRaw[baseIdx].close;
    // Build lookup from date key -> % return
    const map = new Map();
    for (let i = baseIdx; i < spRaw.length; i++) {
      map.set(dateKey(spRaw[i].date), ((spRaw[i].close - baseClose) / baseClose) * 100);
    }
    // Align to portfolio points by date
    const series = [];
    let lastVal = 0;
    for (const pt of points) {
      const key = dateKey(pt.date);
      if (map.has(key)) lastVal = map.get(key);
      series.push(lastVal);
    }
    return series;
  }, [hasData, points, spRaw]);

  // Portfolio % return series
  const portPctSeries = useMemo(() => {
    if (!hasData) return [];
    const base = points[0].equity;
    return points.map((p) => ((p.equity - base) / base) * 100);
  }, [points, hasData]);

  // Compute unified Y scale across both series (% return)
  const chart = useMemo(() => {
    if (!hasData) return {};
    const allVals = [...portPctSeries];
    if (spSeries.length) allVals.push(...spSeries);
    const mn = Math.min(...allVals);
    const mx = Math.max(...allVals);
    const yPad = (mx - mn) * 0.12 || 1;
    const yMin = mn - yPad;
    const yMax = mx + yPad;
    const plotW = VB_W - PAD.left - PAD.right;
    const plotH = VB_H - PAD.top - PAD.bottom;

    const sx = (i) => PAD.left + (i / (points.length - 1)) * plotW;
    const sy = (val) => PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

    const buildPath = (series) =>
      series.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');

    const portPath = buildPath(portPctSeries);
    const spPath = spSeries.length === portPctSeries.length ? buildPath(spSeries) : null;

    return { yMin, yMax, sx, sy, portPath, spPath, plotW, plotH };
  }, [hasData, portPctSeries, spSeries, points]);

  const { yMin, yMax, sx, sy, portPath, spPath } = chart;

  const portReturn = hasData ? portPctSeries[portPctSeries.length - 1] : 0;
  const portDollarReturn = hasData ? points[points.length - 1].equity - points[0].equity : 0;
  const isPositive = portReturn >= 0;
  const portColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

  const spReturn = spSeries.length ? spSeries[spSeries.length - 1] : null;

  // Y-axis ticks (% return)
  const yTicks = useMemo(() => {
    if (!hasData) return [];
    const count = 5;
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const val = yMin + ((yMax - yMin) * i) / (count - 1);
      ticks.push({ val, y: sy(val) });
    }
    return ticks;
  }, [hasData, yMin, yMax, sy]);

  // X-axis labels
  const xLabels = useMemo(() => {
    if (!hasData) return [];
    const count = Math.min(points.length, 6);
    const labels = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (points.length - 1));
      labels.push({ label: formatDate(points[idx].date), x: sx(idx) });
    }
    return labels;
  }, [points, hasData, sx]);

  const hoverPoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;

  return (
    <div className="featured-chart">
      <div className="chart-header">
        <div className="chart-header-left">
          <h2 className="chart-title">Portfolio Performance</h2>
          {hasData && (
            <div className="chart-stats">
              <span className={`chart-stat-value ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{formatCurrency(portDollarReturn)}
              </span>
              <span className={`chart-stat-pct ${isPositive ? 'positive' : 'negative'}`}>
                ({isPositive ? '+' : ''}{portReturn.toFixed(2)}%)
              </span>
              {spReturn !== null && (
                <span className="chart-stat-sp">
                  S&amp;P: {spReturn >= 0 ? '+' : ''}{spReturn.toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="chart-controls">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              className={`chart-btn ${activeRange === range ? 'active' : ''}`}
              onClick={() => setActiveRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="chart-svg-wrap">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="chart-svg"
            onMouseLeave={() => setHoverIdx(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * VB_W;
              const plotX = x - PAD.left;
              const plotW = VB_W - PAD.left - PAD.right;
              const idx = Math.round((plotX / plotW) * (points.length - 1));
              if (idx >= 0 && idx < points.length) setHoverIdx(idx);
              else setHoverIdx(null);
            }}
          >
            {/* Grid lines */}
            {yTicks.map((t, i) => (
              <line
                key={i}
                x1={PAD.left}
                x2={VB_W - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
            ))}

            {/* Zero line */}
            {yMin < 0 && yMax > 0 && (
              <line
                x1={PAD.left}
                x2={VB_W - PAD.right}
                y1={sy(0)}
                y2={sy(0)}
                stroke="var(--text-secondary)"
                strokeWidth="0.5"
                strokeDasharray="4,3"
                opacity="0.5"
              />
            )}

            {/* Y-axis labels */}
            {yTicks.map((t, i) => (
              <text
                key={`yl-${i}`}
                x={PAD.left - 10}
                y={t.y + 4}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize="12"
                fontFamily="IBM Plex Mono, monospace"
              >
                {t.val >= 0 ? '+' : ''}{t.val.toFixed(1)}%
              </text>
            ))}

            {/* X-axis labels */}
            {xLabels.map((l, i) => (
              <text
                key={`xl-${i}`}
                x={l.x}
                y={VB_H - 8}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="12"
                fontFamily="IBM Plex Mono, monospace"
              >
                {l.label}
              </text>
            ))}

            {/* Portfolio gradient fill */}
            <defs>
              <linearGradient id="eqFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={portColor} stopOpacity="0.12" />
                <stop offset="100%" stopColor={portColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${portPath} L${sx(points.length - 1).toFixed(1)},${(VB_H - PAD.bottom).toFixed(1)} L${PAD.left.toFixed(1)},${(VB_H - PAD.bottom).toFixed(1)} Z`}
              fill="url(#eqFill)"
            />

            {/* S&P line */}
            {spPath && (
              <path d={spPath} fill="none" stroke="var(--accent-blue)" strokeWidth="1.5" opacity="0.5" />
            )}

            {/* Portfolio line */}
            <path d={portPath} fill="none" stroke={portColor} strokeWidth="2" />

            {/* Hover crosshair + dots */}
            {hoverPoint && (
              <>
                <line
                  x1={sx(hoverIdx)}
                  x2={sx(hoverIdx)}
                  y1={PAD.top}
                  y2={VB_H - PAD.bottom}
                  stroke="var(--text-secondary)"
                  strokeWidth="0.5"
                  strokeDasharray="4,3"
                />
                <circle
                  cx={sx(hoverIdx)}
                  cy={sy(portPctSeries[hoverIdx])}
                  r="4"
                  fill={portColor}
                  stroke="var(--bg-card)"
                  strokeWidth="2"
                />
                {spSeries.length > hoverIdx && (
                  <circle
                    cx={sx(hoverIdx)}
                    cy={sy(spSeries[hoverIdx])}
                    r="3"
                    fill="var(--accent-blue)"
                    stroke="var(--bg-card)"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                )}
              </>
            )}
          </svg>

          {/* Hover tooltip */}
          {hoverPoint && (
            <div
              className="chart-tooltip"
              style={{
                left: `${(sx(hoverIdx) / VB_W) * 100}%`,
                top: `${(sy(portPctSeries[hoverIdx]) / VB_H) * 100}%`,
              }}
            >
              <span className="chart-tooltip-date">{formatDate(hoverPoint.date)}</span>
              <span className="chart-tooltip-equity">{hoverPoint.equity.toLocaleString()}</span>
              <span className={`chart-tooltip-pnl ${portPctSeries[hoverIdx] >= 0 ? 'positive' : 'negative'}`}>
                {portPctSeries[hoverIdx] >= 0 ? '+' : ''}{portPctSeries[hoverIdx].toFixed(2)}%
              </span>
              {spSeries.length > hoverIdx && (
                <span className="chart-tooltip-sp">
                  S&amp;P: {spSeries[hoverIdx] >= 0 ? '+' : ''}{spSeries[hoverIdx].toFixed(2)}%
                </span>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="chart-legend">
            <span className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-port" />
              Portfolio
            </span>
            <span className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-sp" />
              S&amp;P 500
            </span>
          </div>
        </div>
      ) : (
        <div className="large-chart">
          No P&amp;L data yet. Add a starting balance and daily P&amp;L entries in the
          <a href="/pnl" className="chart-empty-link"> P&amp;L tab </a>
          to see your performance chart.
        </div>
      )}
    </div>
  );
}
