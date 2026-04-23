import { useMemo, useState } from 'react';
import './Links.css';

const STORAGE_KEY = 'savedLinks';

function loadLinks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed.map((link) => ({
      ...link,
      title: link.title || '',
      tags: Array.isArray(link.tags) ? link.tags : [],
    }));
  } catch {
    return [];
  }
}

function saveLinks(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export default function Links() {
  const [links, setLinks] = useState(loadLinks);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [pendingTags, setPendingTags] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const commit = (next) => {
    setLinks(next);
    saveLinks(next);
  };

  const addLink = () => {
    const url = urlInput.trim();
    if (!url) return;
    const next = [
      ...links,
      {
        id: Date.now(),
        url,
        title: titleInput.trim(),
        tags: pendingTags,
      },
    ];
    commit(next);
    setUrlInput('');
    setTitleInput('');
    setTagInput('');
    setPendingTags([]);
  };

  const removeLink = (id) => {
    commit(links.filter((l) => l.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const saveEdit = (id, updates) => {
    commit(links.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    setEditingId(null);
  };

  const handleUrlKeyDown = (e) => {
    if (e.key === 'Enter') addLink();
  };

  const handlePendingTagKey = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!pendingTags.includes(newTag)) {
        setPendingTags((prev) => [...prev, newTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && pendingTags.length) {
      setPendingTags((prev) => prev.slice(0, -1));
    }
  };

  const removePendingTag = (tag) => {
    setPendingTags((prev) => prev.filter((t) => t !== tag));
  };

  const allTags = useMemo(() => {
    const set = new Set();
    links.forEach((l) => l.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [links]);

  const toggleActiveTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return links.filter((l) => {
      if (q) {
        const hay = `${l.title} ${l.url}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeTags.length && !activeTags.every((t) => l.tags.includes(t))) {
        return false;
      }
      return true;
    });
  }, [links, search, activeTags]);

  const formExpanded =
    urlInput.trim().length > 0 ||
    titleInput.length > 0 ||
    tagInput.length > 0 ||
    pendingTags.length > 0;

  return (
    <div className="links-page">
      <div className="links-header">
        <h2>Links</h2>
      </div>

      <div className={`links-add ${formExpanded ? 'is-expanded' : ''}`}>
        <div className="links-add-row">
          <input
            className="links-input"
            type="text"
            placeholder="Paste a URL…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
          />
          <button className="links-add-btn" onClick={addLink}>
            Add
          </button>
        </div>
        {formExpanded && (
          <>
            <input
              className="links-input"
              type="text"
              placeholder="Title (optional)"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addLink();
              }}
            />
            <div className="links-tag-area">
              {pendingTags.map((tag) => (
                <span key={tag} className="links-chip">
                  {tag}
                  <button onClick={() => removePendingTag(tag)}>&times;</button>
                </span>
              ))}
              <input
                className="links-inline-input"
                type="text"
                placeholder="Type a tag and press Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handlePendingTagKey}
              />
            </div>
          </>
        )}
      </div>

      {links.length > 0 && (
        <div className="links-filter">
          <input
            className="links-input links-search"
            type="text"
            placeholder="Search title or URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {allTags.length > 0 && (
            <div className="links-tag-filters">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`links-chip links-chip-filter ${
                    activeTags.includes(tag) ? 'is-active' : ''
                  }`}
                  onClick={() => toggleActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {links.length === 0 ? (
        <div className="links-empty">No links saved yet.</div>
      ) : filtered.length === 0 ? (
        <div className="links-empty">No links match the current filters.</div>
      ) : (
        <ul className="links-list">
          {filtered.map((link) =>
            editingId === link.id ? (
              <LinkEditRow
                key={link.id}
                link={link}
                onCancel={() => setEditingId(null)}
                onSave={(updates) => saveEdit(link.id, updates)}
              />
            ) : (
              <LinkRow
                key={link.id}
                link={link}
                onEdit={() => setEditingId(link.id)}
                onRemove={() => removeLink(link.id)}
              />
            )
          )}
        </ul>
      )}
    </div>
  );
}

function LinkRow({ link, onEdit, onRemove }) {
  const primary = link.title || link.url;
  return (
    <li className="links-item">
      <div className="links-item-main">
        <a
          className="links-primary"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {primary}
        </a>
        {link.title && <div className="links-url-sub">{link.url}</div>}
        {link.tags.length > 0 && (
          <div className="links-item-tags">
            {link.tags.map((tag) => (
              <span key={tag} className="links-chip links-chip-static">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="links-item-actions">
        <button
          className="links-icon-btn"
          onClick={onEdit}
          title="Edit link"
          aria-label="Edit link"
        >
          ✎
        </button>
        <button
          className="links-icon-btn links-delete-btn"
          onClick={onRemove}
          title="Remove link"
          aria-label="Remove link"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function LinkEditRow({ link, onCancel, onSave }) {
  const [titleDraft, setTitleDraft] = useState(link.title);
  const [tagsDraft, setTagsDraft] = useState(link.tags);
  const [tagInput, setTagInput] = useState('');

  const handleTagKey = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tagsDraft.includes(newTag)) {
        setTagsDraft((prev) => [...prev, newTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tagsDraft.length) {
      setTagsDraft((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag) => {
    setTagsDraft((prev) => prev.filter((t) => t !== tag));
  };

  const save = () => {
    onSave({ title: titleDraft.trim(), tags: tagsDraft });
  };

  return (
    <li className="links-item links-item-editing">
      <div className="links-item-main">
        <div className="links-url-sub">{link.url}</div>
        <input
          className="links-input links-edit-title"
          type="text"
          placeholder="Title (optional)"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') onCancel();
          }}
          autoFocus
        />
        <div className="links-tag-area">
          {tagsDraft.map((tag) => (
            <span key={tag} className="links-chip">
              {tag}
              <button onClick={() => removeTag(tag)}>&times;</button>
            </span>
          ))}
          <input
            className="links-inline-input"
            type="text"
            placeholder="Type a tag and press Enter…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
          />
        </div>
      </div>
      <div className="links-item-actions">
        <button className="links-icon-btn links-save-btn" onClick={save} title="Save">
          ✓
        </button>
        <button className="links-icon-btn" onClick={onCancel} title="Cancel">
          ✕
        </button>
      </div>
    </li>
  );
}
