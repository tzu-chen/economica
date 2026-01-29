export const marketMetrics = [
  { label: 'S&P 500', value: '6,042.16', change: '+0.8%', status: 'positive' },
  { label: 'VIX', value: '18.42', change: '-2.1%', status: '' },
  { label: '10Y Yield', value: '4.28%', change: null, status: 'neutral' },
  { label: 'WTI Crude', value: '$76.45', change: '+2.3%', status: 'positive' },
  { label: 'DXY', value: '103.24', change: '-0.4%', status: 'negative' },
];

export const signals = [
  {
    type: 'bullish',
    title: 'Bullish Energy',
    description: 'COT positioning + seasonal tailwinds converging',
  },
  {
    type: 'bearish',
    title: 'Caution Tech',
    description: 'Elevated valuations + vol compression warning',
  },
  {
    type: 'neutral',
    title: 'Neutral Financials',
    description: 'Rate environment stabilizing, watching spreads',
  },
];

export const trackRecord = {
  period: '2025 YTD',
  chartLabel: 'Cumulative Return Chart\n+12.4% vs SPY +8.1%',
  metrics: [
    { label: 'Win Rate', value: '68%', color: 'var(--accent-green)' },
    { label: 'Avg Return', value: '+12.4%', color: 'var(--accent-green)' },
    { label: 'Sharpe Ratio', value: '1.82', color: null },
    { label: 'Max Drawdown', value: '-8.2%', color: 'var(--accent-red)' },
  ],
};

export const positioning = {
  chartLabel: 'Sector Allocation\nEnergy 25% \u2022 Value 20%\nTech 15% \u2022 Others 40%',
  metrics: [
    { label: 'Active Positions', value: '12', color: null },
    { label: 'Cash', value: '18%', color: null },
    { label: 'Beta to SPY', value: '0.72', color: null },
  ],
};
