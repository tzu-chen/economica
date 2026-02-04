import { useState } from 'react';
import useWatchlist from '../hooks/useWatchlist';
import './Sidebar.css';

function WatchlistRow({ item, priceData, onRemove, onUpdateLimits }) {
  const [editing, setEditing] = useState(false);
  const [upper, setUpper] = useState(item.upperLimit);
  const [lower, setLower] = useState(item.lowerLimit);

  const price = priceData?.price;
  const changePct = priceData?.changePercent;

  const upperNum = item.upperLimit !== '' ? Number(item.upperLimit) : null;
  const lowerNum = item.lowerLimit !== '' ? Number(item.lowerLimit) : null;

  const hitUpper = price != null && upperNum != null && price >= upperNum;
  const hitLower = price != null && lowerNum != null && price <= lowerNum;
  const highlighted = hitUpper || hitLower;

  function handleSave() {
    onUpdateLimits(
      item.symbol,
      upper === '' ? '' : upper,
      lower === '' ? '' : lower,
    );
    setEditing(false);
  }

  function handleCancel() {
    setUpper(item.upperLimit);
    setLower(item.lowerLimit);
    setEditing(false);
  }

  return (
    <div className={`watchlist-row${highlighted ? ' watchlist-row--alert' : ''}`}>
      <div className="watchlist-row-main">
        <div className="watchlist-symbol">{item.symbol}</div>
        <div className="watchlist-price-group">
          {price != null ? (
            <>
              <span className="watchlist-price">
                {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`watchlist-change ${changePct >= 0 ? 'positive' : 'negative'}`}>
                {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
              </span>
            </>
          ) : (
            <span className="watchlist-price">--</span>
          )}
        </div>
        <div className="watchlist-actions">
          <button className="watchlist-edit-btn" onClick={() => setEditing(!editing)} title="Set limits">
            {editing ? '...' : '\u2699'}
          </button>
          <button className="watchlist-remove-btn" onClick={() => onRemove(item.symbol)} title="Remove">
            &times;
          </button>
        </div>
      </div>

      {/* Limit display */}
      {!editing && (upperNum != null || lowerNum != null) && (
        <div className="watchlist-limits-display">
          {lowerNum != null && (
            <span className={`watchlist-limit-tag${hitLower ? ' limit-hit' : ''}`}>
              Lo: {lowerNum.toFixed(2)}
            </span>
          )}
          {upperNum != null && (
            <span className={`watchlist-limit-tag${hitUpper ? ' limit-hit' : ''}`}>
              Hi: {upperNum.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Limit editor */}
      {editing && (
        <div className="watchlist-limit-editor">
          <div className="limit-field">
            <label>Lower</label>
            <input
              type="number"
              step="any"
              value={lower}
              onChange={(e) => setLower(e.target.value)}
              placeholder="No limit"
            />
          </div>
          <div className="limit-field">
            <label>Upper</label>
            <input
              type="number"
              step="any"
              value={upper}
              onChange={(e) => setUpper(e.target.value)}
              placeholder="No limit"
            />
          </div>
          <div className="limit-buttons">
            <button className="limit-save-btn" onClick={handleSave}>Save</button>
            <button className="limit-cancel-btn" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { items, prices, addSymbol, removeSymbol, updateLimits } = useWatchlist();
  const [input, setInput] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    addSymbol(input);
    setInput('');
  }

  return (
    <div className="sidebar">
      <div className="sidebar-panel">
        <h4 className="panel-title">Watchlist</h4>

        <form className="watchlist-add-form" onSubmit={handleAdd}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add symbol (e.g. AAPL)"
            className="watchlist-add-input"
          />
          <button type="submit" className="watchlist-add-btn" disabled={!input.trim()}>
            +
          </button>
        </form>

        {items.length === 0 ? (
          <p className="watchlist-empty">No symbols added yet.</p>
        ) : (
          <div className="watchlist-list">
            {items.map((item) => (
              <WatchlistRow
                key={item.symbol}
                item={item}
                priceData={prices.get(item.symbol)}
                onRemove={removeSymbol}
                onUpdateLimits={updateLimits}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
