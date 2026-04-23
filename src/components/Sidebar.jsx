import { useState } from 'react';
import useWatchlist from '../hooks/useWatchlist';
import './Sidebar.css';

const NEW_GROUP_VALUE = '__new__';
const REMOVE_GROUP_VALUE = '__remove__';

function WatchlistRow({ item, priceData, groups, onRemove, onUpdateLimits, onAssignGroup }) {
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

  function handleGroupSelect(e) {
    const value = e.target.value;
    e.target.value = '';
    if (!value) return;
    if (value === NEW_GROUP_VALUE) {
      const name = prompt('New group name:');
      const trimmed = (name || '').trim();
      if (trimmed) onAssignGroup(item.symbol, trimmed);
      return;
    }
    if (value === REMOVE_GROUP_VALUE) {
      onAssignGroup(item.symbol, '');
      return;
    }
    onAssignGroup(item.symbol, value);
  }

  const otherGroups = groups.filter((g) => g !== item.group);

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
          <div className="watchlist-group-assign">
            <button className="watchlist-edit-btn" title="Assign group" tabIndex={-1} aria-hidden="true">
              &#128193;
            </button>
            <select
              value=""
              onChange={handleGroupSelect}
              className="watchlist-group-select"
              aria-label={`Assign group for ${item.symbol}`}
            >
              <option value="" disabled hidden>Group</option>
              {otherGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value={NEW_GROUP_VALUE}>+ New group…</option>
              {item.group && <option value={REMOVE_GROUP_VALUE}>Remove from group</option>}
            </select>
          </div>
          <button className="watchlist-edit-btn" onClick={() => setEditing(!editing)} title="Set limits">
            {editing ? '...' : '⚙'}
          </button>
          <button className="watchlist-remove-btn" onClick={() => onRemove(item.symbol)} title="Remove">
            &times;
          </button>
        </div>
      </div>

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

function WatchlistGroup({ name, items, prices, collapsed, onToggle, ...rowProps }) {
  return (
    <div className="watchlist-group">
      <button
        type="button"
        className={`watchlist-group-header${collapsed ? ' collapsed' : ''}`}
        onClick={onToggle}
      >
        <span className="watchlist-group-chevron">▾</span>
        <span className="watchlist-group-name">{name}</span>
        <span className="watchlist-group-count">{items.length}</span>
      </button>
      {!collapsed && (
        <div className="watchlist-group-items">
          {items.map((item) => (
            <WatchlistRow
              key={item.symbol}
              item={item}
              priceData={prices.get(item.symbol)}
              {...rowProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ManageGroups({ groups, onRename, onRemove, onClose }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  function startRename(name) {
    setEditing(name);
    setDraft(name);
  }

  function commitRename() {
    if (editing && draft.trim() && draft.trim() !== editing) {
      onRename(editing, draft.trim());
    }
    setEditing(null);
    setDraft('');
  }

  return (
    <div className="watchlist-manage-groups">
      <div className="watchlist-manage-header">
        <span>Manage groups</span>
        <button className="watchlist-manage-close" onClick={onClose} title="Close">
          &times;
        </button>
      </div>
      {groups.length === 0 ? (
        <p className="watchlist-manage-empty">No groups yet. Use a row&rsquo;s folder menu to create one.</p>
      ) : (
        <ul className="watchlist-manage-list">
          {groups.map((g) => (
            <li key={g} className="watchlist-manage-item">
              {editing === g ? (
                <>
                  <input
                    className="watchlist-manage-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') {
                        setEditing(null);
                        setDraft('');
                      }
                    }}
                    autoFocus
                  />
                  <button className="watchlist-manage-btn" onClick={commitRename}>Save</button>
                  <button
                    className="watchlist-manage-btn secondary"
                    onClick={() => {
                      setEditing(null);
                      setDraft('');
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="watchlist-manage-name">{g}</span>
                  <button className="watchlist-manage-btn" onClick={() => startRename(g)}>Rename</button>
                  <button
                    className="watchlist-manage-btn danger"
                    onClick={() => {
                      if (confirm(`Remove group "${g}"? Symbols will become ungrouped.`)) {
                        onRemove(g);
                      }
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar() {
  const {
    items,
    prices,
    groups,
    addSymbol,
    removeSymbol,
    updateLimits,
    updateGroup,
    renameGroup,
    removeGroup,
  } = useWatchlist();

  const [input, setInput] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [managing, setManaging] = useState(false);

  function handleAdd(e) {
    e.preventDefault();
    addSymbol(input);
    setInput('');
  }

  const toggleCollapse = (name) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const ungrouped = items.filter((i) => !i.group);
  const grouped = groups.map((g) => ({
    name: g,
    items: items.filter((i) => i.group === g),
  }));

  const rowProps = {
    groups,
    prices,
    onRemove: removeSymbol,
    onUpdateLimits: updateLimits,
    onAssignGroup: updateGroup,
  };

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

        {(groups.length > 0 || managing) && (
          <div className="watchlist-manage-toggle">
            <button
              type="button"
              className="watchlist-manage-link"
              onClick={() => setManaging((v) => !v)}
            >
              {managing ? 'Hide groups' : 'Manage groups'}
            </button>
          </div>
        )}

        {managing && (
          <ManageGroups
            groups={groups}
            onRename={renameGroup}
            onRemove={removeGroup}
            onClose={() => setManaging(false)}
          />
        )}

        {items.length === 0 ? (
          <p className="watchlist-empty">No symbols added yet.</p>
        ) : (
          <div className="watchlist-list">
            {grouped.map((g) => (
              <WatchlistGroup
                key={g.name}
                name={g.name}
                items={g.items}
                prices={prices}
                collapsed={!!collapsed[g.name]}
                onToggle={() => toggleCollapse(g.name)}
                {...rowProps}
              />
            ))}

            {ungrouped.length > 0 && (
              <div className="watchlist-ungrouped">
                {grouped.length > 0 && (
                  <div className="watchlist-ungrouped-label">Ungrouped</div>
                )}
                {ungrouped.map((item) => (
                  <WatchlistRow
                    key={item.symbol}
                    item={item}
                    priceData={prices.get(item.symbol)}
                    {...rowProps}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
