import { useState } from 'react';
import './Links.css';

const STORAGE_KEY = 'savedLinks';

function loadLinks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export default function Links() {
  const [links, setLinks] = useState(loadLinks);
  const [input, setInput] = useState('');

  const addLink = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const next = [...links, { id: Date.now(), url: trimmed }];
    setLinks(next);
    saveLinks(next);
    setInput('');
  };

  const removeLink = (id) => {
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    saveLinks(next);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addLink();
  };

  return (
    <div className="links-page">
      <div className="links-header">
        <h2>Links</h2>
      </div>

      <div className="links-add">
        <input
          className="links-input"
          type="text"
          placeholder="Paste a URL and press Enter…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="links-add-btn" onClick={addLink}>
          Add
        </button>
      </div>

      {links.length === 0 ? (
        <div className="links-empty">No links saved yet.</div>
      ) : (
        <ul className="links-list">
          {links.map((link) => (
            <li key={link.id} className="links-item">
              <a
                className="links-url"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.url}
              </a>
              <button
                className="links-delete-btn"
                onClick={() => removeLink(link.id)}
                title="Remove link"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
