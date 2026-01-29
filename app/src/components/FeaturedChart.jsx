import { useState } from 'react';
import './FeaturedChart.css';

const TIME_RANGES = ['1M', '3M', 'YTD', '1Y', 'All'];

export default function FeaturedChart() {
  const [activeRange, setActiveRange] = useState('3M');

  return (
    <div className="featured-chart">
      <div className="chart-header">
        <h2 className="chart-title">Portfolio Performance vs Benchmarks</h2>
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
      <div className="large-chart">
        Interactive Chart: Your Returns vs S&amp;P 500, Commodities Index, 60/40
        Portfolio
        <br />
        Click timeframes above to adjust view &bull; Hover for detailed tooltips
      </div>
    </div>
  );
}
