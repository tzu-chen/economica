import { useState, useMemo } from 'react';
import { usePnlSnapshot, useEquityCurve } from '../hooks/usePnlData';
import './FeaturedChart.css';

const TIME_RANGES = ['1M', '3M', 'YTD', '1Y', 'All'];

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

const CHART_W = 800;
const CHART_H = 280;
const PAD = { top: 20, right: 20, bottom: 32, left: 64 };

export default function FeaturedChart() {
  const [activeRange, setActiveRange] = useState('3M');
  const [hoverIdx, setHoverIdx] = useState(null);

  const pnlData = usePnlSnapshot();
  const allPoints = useEquityCurve(pnlData);
  const points = useMemo(() => filterByRange(allPoints, activeRange), [allPoints, activeRange]);

  const hasData = points.length > 1;

  const { minY, maxY, scaleX, scaleY, pathD, startEquity, endEquity } = useMemo(() => {
    if (!hasData) return {};
    const equities = points.map((p) => p.equity);
    const mn = Math.min(...equities);
    const mx = Math.max(...equities);
    const pad = (mx - mn) * 0.1 || 1;
    const yMin = mn - pad;
    const yMax = mx + pad;
    const plotW = CHART_W - PAD.left - PAD.right;
    const plotH = CHART_H - PAD.top - PAD.bottom;

    const sx = (i) => PAD.left + (i / (points.length - 1)) * plotW;
    const sy = (val) => PAD.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(p.equity).toFixed(1)}`).join(' ');

    return {
      minY: yMin,
      maxY: yMax,
      scaleX: sx,
      scaleY: sy,
      pathD: d,
      startEquity: points[0].equity,
      endEquity: points[points.length - 1].equity,
    };
  }, [points, hasData]);

  const totalReturn = hasData ? endEquity - startEquity : 0;
  const pctReturn = hasData && startEquity !== 0 ? ((endEquity - startEquity) / startEquity) * 100 : 0;
  const isPositive = totalReturn >= 0;
  const lineColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';

  // Y-axis ticks
  const yTicks = useMemo(() => {
    if (!hasData) return [];
    const count = 5;
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const val = minY + ((maxY - minY) * i) / (count - 1);
      ticks.push({ val, y: scaleY(val) });
    }
    return ticks;
  }, [hasData, minY, maxY, scaleY]);

  // X-axis labels (sample a few)
  const xLabels = useMemo(() => {
    if (!hasData) return [];
    const count = Math.min(points.length, 6);
    const labels = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (points.length - 1));
      labels.push({ label: formatDate(points[idx].date), x: scaleX(idx) });
    }
    return labels;
  }, [points, hasData, scaleX]);

  const hoverPoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : null;

  return (
    <div className="featured-chart">
      <div className="chart-header">
        <div className="chart-header-left">
          <h2 className="chart-title">Portfolio Performance</h2>
          {hasData && (
            <div className="chart-stats">
              <span className={`chart-stat-value ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{formatCurrency(totalReturn)}
              </span>
              <span className={`chart-stat-pct ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{pctReturn.toFixed(2)}%
              </span>
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
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            className="chart-svg"
            onMouseLeave={() => setHoverIdx(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * CHART_W;
              const plotX = x - PAD.left;
              const plotW = CHART_W - PAD.left - PAD.right;
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
                x2={CHART_W - PAD.right}
                y1={t.y}
                y2={t.y}
                stroke="var(--border)"
                strokeWidth="0.5"
              />
            ))}

            {/* Y-axis labels */}
            {yTicks.map((t, i) => (
              <text
                key={`yl-${i}`}
                x={PAD.left - 8}
                y={t.y + 4}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize="11"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {formatCurrency(t.val)}
              </text>
            ))}

            {/* X-axis labels */}
            {xLabels.map((l, i) => (
              <text
                key={`xl-${i}`}
                x={l.x}
                y={CHART_H - 6}
                textAnchor="middle"
                fill="var(--text-secondary)"
                fontSize="11"
                fontFamily="'IBM Plex Mono', monospace"
              >
                {l.label}
              </text>
            ))}

            {/* Gradient fill */}
            <defs>
              <linearGradient id="eqFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${pathD} L${scaleX(points.length - 1).toFixed(1)},${(CHART_H - PAD.bottom).toFixed(1)} L${PAD.left.toFixed(1)},${(CHART_H - PAD.bottom).toFixed(1)} Z`}
              fill="url(#eqFill)"
            />

            {/* Line */}
            <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" />

            {/* Hover crosshair + dot */}
            {hoverPoint && (
              <>
                <line
                  x1={scaleX(hoverIdx)}
                  x2={scaleX(hoverIdx)}
                  y1={PAD.top}
                  y2={CHART_H - PAD.bottom}
                  stroke="var(--text-secondary)"
                  strokeWidth="0.5"
                  strokeDasharray="4,3"
                />
                <circle
                  cx={scaleX(hoverIdx)}
                  cy={scaleY(hoverPoint.equity)}
                  r="4"
                  fill={lineColor}
                  stroke="var(--bg-card)"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>

          {/* Hover tooltip */}
          {hoverPoint && (
            <div
              className="chart-tooltip"
              style={{
                left: `${(scaleX(hoverIdx) / CHART_W) * 100}%`,
                top: `${(scaleY(hoverPoint.equity) / CHART_H) * 100}%`,
              }}
            >
              <span className="chart-tooltip-date">{formatDate(hoverPoint.date)}</span>
              <span className="chart-tooltip-equity">{hoverPoint.equity.toLocaleString()}</span>
              {hoverPoint.dailyPnl !== 0 && (
                <span className={`chart-tooltip-pnl ${hoverPoint.dailyPnl > 0 ? 'positive' : 'negative'}`}>
                  {hoverPoint.dailyPnl > 0 ? '+' : ''}{hoverPoint.dailyPnl.toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="large-chart">
          No P&amp;L data yet. Add a starting balance and daily P&amp;L entries in the
          <a href="/pnl" className="chart-empty-link">P&amp;L tab</a>
          to see your performance chart.
        </div>
      )}
    </div>
  );
}
