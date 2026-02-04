import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { loadPnlData, savePnlData, getDaysInMonth, getMonthKey, loadPnlNotes, savePnlNotes } from '../hooks/usePnlData';
import './Pnl.css';

function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) {
    const endMonth = y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = endMonth; m >= 0; m--) {
      options.push({ year: y, month: m });
    }
  }
  return options;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Pnl() {
  const now = new Date();
  const [data, setData] = useState(loadPnlData);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [editingDay, setEditingDay] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [balanceInput, setBalanceInput] = useState('');
  const [editingBalance, setEditingBalance] = useState(false);

  const [notes, setNotes] = useState(loadPnlNotes);
  const [noteDay, setNoteDay] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const noteRef = useRef(null);

  const monthKey = getMonthKey(year, month);
  const monthData = data[monthKey] || {};
  const startingBalance = monthData._balance ?? null;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const days = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [daysInMonth]);

  const cumulativePnl = useMemo(() => {
    let sum = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const val = monthData[d];
      if (val !== undefined && val !== null && val !== '') {
        sum += Number(val);
      }
    }
    return sum;
  }, [monthData, daysInMonth]);

  const pctChange = useMemo(() => {
    if (startingBalance === null || startingBalance === 0) return null;
    return (cumulativePnl / startingBalance) * 100;
  }, [cumulativePnl, startingBalance]);

  const handleMonthChange = useCallback((e) => {
    const [y, m] = e.target.value.split('-').map(Number);
    setYear(y);
    setMonth(m);
    setEditingDay(null);
    setEditingBalance(false);
  }, []);

  const startEditBalance = useCallback(() => {
    setEditingBalance(true);
    setBalanceInput(startingBalance !== null ? String(startingBalance) : '');
  }, [startingBalance]);

  const saveBalance = useCallback(() => {
    const next = { ...data };
    if (!next[monthKey]) next[monthKey] = {};
    const trimmed = balanceInput.trim();
    if (trimmed === '') {
      delete next[monthKey]._balance;
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        next[monthKey]._balance = num;
      }
    }
    setData(next);
    savePnlData(next);
    setEditingBalance(false);
    setBalanceInput('');
  }, [balanceInput, data, monthKey]);

  const handleBalanceKeyDown = useCallback((e) => {
    if (e.key === 'Enter') saveBalance();
    if (e.key === 'Escape') {
      setEditingBalance(false);
      setBalanceInput('');
    }
  }, [saveBalance]);

  const startEdit = useCallback((day) => {
    setEditingDay(day);
    const current = monthData[day];
    setEditValue(current !== undefined && current !== null ? String(current) : '');
  }, [monthData]);

  const saveEdit = useCallback(() => {
    if (editingDay === null) return;
    const next = { ...data };
    if (!next[monthKey]) next[monthKey] = {};

    const trimmed = editValue.trim();
    if (trimmed === '') {
      delete next[monthKey][editingDay];
      if (Object.keys(next[monthKey]).length === 0) delete next[monthKey];
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        next[monthKey][editingDay] = num;
      }
    }

    setData(next);
    savePnlData(next);
    setEditingDay(null);
    setEditValue('');
  }, [editingDay, editValue, data, monthKey]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') {
      setEditingDay(null);
      setEditValue('');
    }
  }, [saveEdit]);

  const monthNotes = notes[monthKey] || {};

  const openNote = useCallback((day, e) => {
    e.stopPropagation();
    setNoteDay(day);
    setNoteValue(monthNotes[day] || '');
  }, [monthNotes]);

  const saveNote = useCallback(() => {
    if (noteDay === null) return;
    const next = { ...notes };
    const trimmed = noteValue.trim();
    if (trimmed === '') {
      if (next[monthKey]) {
        delete next[monthKey][noteDay];
        if (Object.keys(next[monthKey]).length === 0) delete next[monthKey];
      }
    } else {
      if (!next[monthKey]) next[monthKey] = {};
      next[monthKey][noteDay] = trimmed;
    }
    setNotes(next);
    savePnlNotes(next);
    setNoteDay(null);
    setNoteValue('');
  }, [noteDay, noteValue, notes, monthKey]);

  // Close note popup on outside click
  useEffect(() => {
    if (noteDay === null) return;
    const handleClick = (e) => {
      if (noteRef.current && !noteRef.current.contains(e.target)) {
        saveNote();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [noteDay, saveNote]);

  const formatPnl = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const n = Number(val);
    if (n > 0) return `+${n.toLocaleString()}`;
    if (n < 0) return n.toLocaleString();
    return '0';
  };

  const pnlClass = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const n = Number(val);
    if (n > 0) return 'pnl-positive';
    if (n < 0) return 'pnl-negative';
    return 'pnl-zero';
  };

  return (
    <div className="pnl-page">
      <div className="pnl-header">
        <h2>Monthly P&L</h2>
        <select
          className="pnl-month-select"
          value={`${year}-${month}`}
          onChange={handleMonthChange}
        >
          {monthOptions.map((opt) => (
            <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
              {MONTH_NAMES[opt.month]} {opt.year}
            </option>
          ))}
        </select>
      </div>

      <div className="pnl-summary">
        <div className="pnl-balance-row" onClick={() => !editingBalance && startEditBalance()}>
          <span className="pnl-balance-label">Starting Balance</span>
          {editingBalance ? (
            <input
              className="pnl-balance-input"
              type="text"
              inputMode="decimal"
              autoFocus
              placeholder="Enter balance"
              value={balanceInput}
              onChange={(e) => setBalanceInput(e.target.value)}
              onKeyDown={handleBalanceKeyDown}
              onBlur={saveBalance}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="pnl-balance-value">
              {startingBalance !== null ? startingBalance.toLocaleString() : '---'}
            </span>
          )}
        </div>
        <div className={`pnl-cumulative ${pnlClass(cumulativePnl)}`}>
          <span className="pnl-cumulative-label">Cumulative P&L</span>
          <div className="pnl-cumulative-right">
            <span className="pnl-cumulative-value">{formatPnl(cumulativePnl)}</span>
            {pctChange !== null && (
              <span className={`pnl-pct ${pnlClass(pctChange)}`}>
                {pctChange > 0 ? '+' : ''}{pctChange.toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="pnl-calendar">
        <div className="pnl-day-labels">
          {DAY_LABELS.map((label) => (
            <div key={label} className="pnl-day-label">{label}</div>
          ))}
        </div>
        <div className="pnl-grid">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="pnl-cell pnl-cell-empty" />
          ))}
          {days.map((day) => {
            const val = monthData[day];
            const isEditing = editingDay === day;
            const hasNote = !!monthNotes[day];
            const isNoteOpen = noteDay === day;
            return (
              <div
                key={day}
                className={`pnl-cell ${pnlClass(val)} ${isEditing ? 'pnl-cell-editing' : ''}`}
                onClick={() => !isEditing && startEdit(day)}
              >
                <div className="pnl-cell-top">
                  <span className="pnl-cell-day">{day}</span>
                  <button
                    className={`pnl-note-btn${hasNote ? ' has-note' : ''}`}
                    title={hasNote ? 'Edit note' : 'Add note'}
                    onClick={(e) => openNote(day, e)}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 1l1 1-9 9-3 1 1-3 9-9zM2 14h12" />
                    </svg>
                  </button>
                </div>
                {isNoteOpen && (
                  <div className="pnl-note-popup" ref={noteRef} onClick={(e) => e.stopPropagation()}>
                    <textarea
                      className="pnl-note-textarea"
                      autoFocus
                      placeholder="Add a note..."
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setNoteDay(null); setNoteValue(''); }
                      }}
                    />
                    <button className="pnl-note-save" onClick={saveNote}>Done</button>
                  </div>
                )}
                {isEditing ? (
                  <input
                    className="pnl-cell-input"
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveEdit}
                  />
                ) : (
                  <span className="pnl-cell-value">{formatPnl(val)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
