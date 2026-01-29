const CHART_BASE = '/api/yahoo/v8/finance/chart';

/**
 * Fetch quote data for a single symbol from Yahoo Finance.
 * Returns { price, previousClose, changePercent, symbol }.
 */
async function fetchQuote(symbol) {
  const res = await fetch(
    `${CHART_BASE}/${encodeURIComponent(symbol)}?range=1d&interval=1d`,
  );
  if (!res.ok) throw new Error(`Yahoo Finance ${res.status} for ${symbol}`);
  const json = await res.json();
  const meta = json.chart.result[0].meta;
  const price = meta.regularMarketPrice;
  const previousClose = meta.chartPreviousClose;
  const changePercent = ((price - previousClose) / previousClose) * 100;
  return { symbol, price, previousClose, changePercent };
}

// DataStrip symbol config
const STRIP_SYMBOLS = [
  { symbol: '^GSPC', label: 'S&P 500', format: 'number' },
  { symbol: '^VIX', label: 'VIX', format: 'number' },
  { symbol: '^TNX', label: '10Y Yield', format: 'percent' },
  { symbol: 'CL=F', label: 'WTI Crude', format: 'dollar' },
  { symbol: 'DX-Y.NYB', label: 'DXY', format: 'number' },
];

function formatPrice(value, format) {
  switch (format) {
    case 'dollar':
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'percent':
      return `${value.toFixed(2)}%`;
    default:
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

function changeStatus(pct) {
  if (pct > 0.05) return 'positive';
  if (pct < -0.05) return 'negative';
  return 'neutral';
}

/**
 * Fetch all DataStrip metrics. Returns an array matching the marketMetrics shape.
 */
export async function fetchMarketMetrics() {
  const results = await Promise.allSettled(
    STRIP_SYMBOLS.map((s) => fetchQuote(s.symbol)),
  );

  return STRIP_SYMBOLS.map((cfg, i) => {
    const result = results[i];
    if (result.status === 'fulfilled') {
      const { price, changePercent } = result.value;
      const sign = changePercent >= 0 ? '+' : '';
      return {
        label: cfg.label,
        value: formatPrice(price, cfg.format),
        change: `${sign}${changePercent.toFixed(1)}%`,
        status: changeStatus(changePercent),
      };
    }
    // On failure, return a placeholder
    return { label: cfg.label, value: '—', change: null, status: 'neutral' };
  });
}

/**
 * Fetch daily percentage change for a list of ticker symbols.
 * Returns a Map<symbol, number> where the number is the % change.
 */
export async function fetchTickerChanges(tickers) {
  if (!tickers || tickers.length === 0) return new Map();

  const results = await Promise.allSettled(
    tickers.map((t) => fetchQuote(t)),
  );

  const map = new Map();
  tickers.forEach((ticker, i) => {
    const result = results[i];
    if (result.status === 'fulfilled') {
      map.set(ticker, result.value.changePercent);
    }
  });
  return map;
}
