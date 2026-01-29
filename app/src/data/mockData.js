export const marketMetrics = [
  { label: 'S&P 500', value: '6,042.16', change: '+0.8%', status: 'positive' },
  { label: 'VIX', value: '18.42', change: '-2.1%', status: '' },
  { label: '10Y Yield', value: '4.28%', change: null, status: 'neutral' },
  { label: 'WTI Crude', value: '$76.45', change: '+2.3%', status: 'positive' },
  { label: 'DXY', value: '103.24', change: '-0.4%', status: 'negative' },
];

export const reports = [
  {
    date: 'Jan 28, 2026',
    category: 'Commodities',
    title: 'Positioning Dynamics in Energy Futures Post-Fed Pivot',
    excerpt:
      'Analysis of net speculative positioning in WTI and Brent crude following December rate cuts. COT data reveals significant shift in managed money positions, with implications for Q1 volatility structure.',
    tags: ['Crude Oil', 'Futures', 'Fed Policy', 'COT Data'],
    chartLabel: 'WTI Net Long Positioning',
    chartNote: 'Chart shows spike in spec longs',
  },
  {
    date: 'Jan 25, 2026',
    category: 'Equities',
    title: 'Healthcare REIT Opportunities in Rising Rate Environment',
    excerpt:
      'Examining valuation compression across healthcare REITs and identifying asymmetric risk/reward in skilled nursing facility operators. Cap rate analysis suggests 15-20% upside in select names.',
    tags: ['REITs', 'Healthcare', 'Value', 'Income'],
    chartLabel: 'P/NAV Discount vs Hist Avg',
    chartNote: 'Currently -18% vs -8% avg',
  },
  {
    date: 'Jan 22, 2026',
    category: 'Options',
    title: 'Volatility Surface Anomalies in Tech Mega-Caps',
    excerpt:
      'Deep dive into implied volatility skew patterns across FAAMG names. Identifying mispriced calendar spreads and risk reversal opportunities based on historical volatility regimes.',
    tags: ['Options', 'Volatility', 'Tech', 'IV Skew'],
    chartLabel: '30d vs 60d IV Spread',
    chartNote: 'Compression opportunity',
  },
  {
    date: 'Jan 18, 2026',
    category: 'Strategy',
    title: 'Q1 2026 Macro Outlook & Positioning Strategy',
    excerpt:
      'Comprehensive quarterly review covering interest rate expectations, commodity cycles, and equity sector rotation. Building framework for navigating uncertain policy environment.',
    tags: ['Macro', 'Quarterly', 'Strategy'],
    chartLabel: 'Sector Allocation Changes',
    chartNote: 'Energy up, Tech down',
  },
  {
    date: 'Jan 15, 2026',
    category: 'Fixed Income',
    title: 'Credit Spread Analysis: IG vs HY Divergence',
    excerpt:
      'Examining unusual spread dynamics between investment grade and high yield corporates. Credit markets pricing in different recession probabilities than equity markets.',
    tags: ['Credit', 'Spreads', 'Fixed Income'],
    chartLabel: 'HY OAS vs IG OAS',
    chartNote: 'Divergence at 3-yr high',
  },
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
