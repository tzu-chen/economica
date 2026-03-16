import { useState, useMemo, useEffect } from 'react';
import { usePnlSnapshot, useEquityCurve } from '../hooks/usePnlData';
import { fetchIndexHistory } from '../services/marketData';
import './FeaturedChart.css';

const TIME_RANGES = ['1M', '3M', 'YTD', '1Y', 'All'];

// Market indices configuration
const INDICES = [
  { symbol: '^GSPC', label: 'S&P 500', color: 'var(--accent-blue)', cssClass: 'sp' },
  { symbol: '^IXIC', label: 'Nasdaq', color: 'var(--index-nasdaq)', cssClass: 'nasdaq' },
  { symbol: '^DJI', label: 'Dow Jones', color: 'var(--index-dow)', cssClass: 'dow' },
  { symbol: '^RUT', label: 'Russell 2000', color: 'var(--index-russell)', cssClass: 'russell' },
];

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
  const [indicesRaw, setIndicesRaw] = useState({});

  const pnlData = usePnlSnapshot();
  const allPoints = useEquityCurve(pnlData);
  const points = useMemo(() => filterByRange(allPoints, activeRange), [allPoints, activeRange]);

  const hasData = points.length > 1;

  // Fetch all indices history when range changes
  useEffect(() => {
    let cancelled = false;
    const yahooRange = rangeToYahoo(activeRange);

    Promise.all(
      INDICES.map((idx) =>
        fetchIndexHistory(idx.symbol, yahooRange)
          .then((data) => ({ symbol: idx.symbol, data }))
          .catch(() => ({ symbol: idx.symbol, data: [] }))
      )
    ).then((results) => {
      if (cancelled) return;
      const raw = {};
      for (const r of results) {
        raw[r.symbol] = r.data;
      }
      setIndicesRaw(raw);
    });

    return () => { cancelled = true; };
  }, [activeRange]);

  // Build index series (% return and close price) aligned to portfolio date range
  const buildIndexSeries = (rawData) => {
    if (!hasData || !rawData || !rawData.length) return { pctSeries: [], closeSeries: [] };
    const startDate = points[0].date;
    const startKey = dateKey(startDate);
    let baseIdx = -1;
    for (let i = 0; i < rawData.length; i++) {
      if (dateKey(rawData[i].date) <= startKey) baseIdx = i;
    }
    if (baseIdx < 0) baseIdx = 0;
    const baseClose = rawData[baseIdx].close;
    // Build lookup from date key -> { pct, close }
    const map = new Map();
    for (let i = baseIdx; i < rawData.length; i++) {
      map.set(dateKey(rawData[i].date), {
        pct: ((rawData[i].close - baseClose) / baseClose) * 100,
        close: rawData[i].close,
      });
    }
    // Align to portfolio points by date
    const pctSeries = [];
    const closeSeries = [];
    let lastPct = 0;
    let lastClose = baseClose;
    for (const pt of points) {
      const key = dateKey(pt.date);
      if (map.has(key)) {
        lastPct = map.get(key).pct;
        lastClose = map.get(key).close;
      }
      pctSeries.push(lastPct);
      closeSeries.push(lastClose);
    }
    return { pctSeries, closeSeries };
  };

  // Build series for all indices
  const indexSeries = useMemo(() => {
    const result = {};
    for (const idx of INDICES) {
      result[idx.symbol] = buildIndexSeries(indicesRaw[idx.symbol]);
    }
    return result;
  }, [hasData, points, indicesRaw]);

  // Portfolio % return series
  const portPctSeries = useMemo(() => {
    if (!hasData) return [];
    const base = points[0].equity;
    return points.map((p) => ((p.equity - base) / base) * 100);
  }, [points, hasData]);

  // Compute unified Y scale across all series (% return)
  const chart = useMemo(() => {
    if (!hasData) return {};
    const allVals = [...portPctSeries];
    // Include all index series in the Y scale calculation
    for (const idx of INDICES) {
      const series = indexSeries[idx.symbol]?.pctSeries;
      if (series?.length) allVals.push(...series);
    }
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

    // Build paths for all indices
    const indexPaths = {};
    for (const idx of INDICES) {
      const series = indexSeries[idx.symbol]?.pctSeries;
      indexPaths[idx.symbol] = series?.length === portPctSeries.length ? buildPath(series) : null;
    }

    return { yMin, yMax, sx, sy, portPath, indexPaths, plotW, plotH };
  }, [hasData, portPctSeries, indexSeries, points]);

  const { yMin, yMax, sx, sy, portPath, indexPaths } = chart;

  const portReturn = hasData ? portPctSeries[portPctSeries.length - 1] : 0;
  const portDollarReturn = hasData ? points[points.length - 1].equity - points[0].equity : 0;
  const isPositive = portReturn >= 0;
  const portColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

  // Get S&P return for header display
  const spReturn = indexSeries['^GSPC']?.pctSeries?.length
    ? indexSeries['^GSPC'].pctSeries[indexSeries['^GSPC'].pctSeries.length - 1]
    : null;

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

            {/* Index lines */}
            {INDICES.map((idx) => (
              indexPaths?.[idx.symbol] && (
                <path
                  key={idx.symbol}
                  d={indexPaths[idx.symbol]}
                  fill="none"
                  stroke={idx.color}
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              )
            ))}

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
                {/* Index hover dots */}
                {INDICES.map((idx) => {
                  const series = indexSeries[idx.symbol]?.pctSeries;
                  return series?.length > hoverIdx && (
                    <circle
                      key={idx.symbol}
                      cx={sx(hoverIdx)}
                      cy={sy(series[hoverIdx])}
                      r="3"
                      fill={idx.color}
                      stroke="var(--bg-card)"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  );
                })}
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
              {/* Index tooltips with closing prices */}
              {INDICES.map((idx) => {
                const pctSeries = indexSeries[idx.symbol]?.pctSeries;
                const closeSeries = indexSeries[idx.symbol]?.closeSeries;
                if (!pctSeries?.length || pctSeries.length <= hoverIdx) return null;
                const pct = pctSeries[hoverIdx];
                const close = closeSeries?.[hoverIdx];
                return (
                  <span key={idx.symbol} className={`chart-tooltip-index chart-tooltip-${idx.cssClass}`}>
                    {idx.label}: {close?.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
                  </span>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="chart-legend">
            <span className="chart-legend-item">
              <span className="chart-legend-swatch chart-legend-port" />
              Portfolio
            </span>
            {INDICES.map((idx) => (
              <span key={idx.symbol} className="chart-legend-item">
                <span className={`chart-legend-swatch chart-legend-${idx.cssClass}`} />
                {idx.label}
              </span>
            ))}
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
