import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useReports } from '../context/ReportsContext';
import './ReportWriter.css';

const CATEGORIES = ['Equities', 'Fixed Income', 'Commodities', 'Options', 'Strategy', 'Macro'];

const DRAFTS_KEY = 'reportDrafts';

function loadDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export default function ReportWriter() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  const { publish, update, getReport } = useReports();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tickers, setTickers] = useState([]);
  const [tickerInput, setTickerInput] = useState('');
  const [images, setImages] = useState([]);
  const [drafts, setDrafts] = useState(loadDrafts);
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [savedMessage, setSavedMessage] = useState('');
  const fileInputRef = useRef(null);
  const initializedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false },
      }),
      Placeholder.configure({ placeholder: 'Start writing your report...' }),
    ],
    content: '',
    shouldRerenderOnTransaction: true,
  });

  // Pre-fill fields when editing an existing report
  useEffect(() => {
    if (!editId || !editor || initializedRef.current) return;
    const existing = getReport(editId);
    if (!existing) return;
    initializedRef.current = true;
    setTitle(existing.title || '');
    setCategory(existing.category || '');
    setTags(existing.tags || []);
    setTickers(existing.tickers || []);
    setImages(
      (existing.images || []).map((img, i) => ({
        id: Date.now() + i,
        src: img.src,
        caption: img.caption || '',
        name: '',
      })),
    );
    if (existing.content) {
      editor.commands.setContent(existing.content);
    }
  }, [editId, editor, getReport]);

  const handleAddTag = useCallback((e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.includes(newTag)) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const handleAddTicker = useCallback((e) => {
    if (e.key === 'Enter' && tickerInput.trim()) {
      e.preventDefault();
      const newTicker = tickerInput.trim().toUpperCase();
      if (!tickers.includes(newTicker)) {
        setTickers((prev) => [...prev, newTicker]);
      }
      setTickerInput('');
    }
  }, [tickerInput, tickers]);

  const handleRemoveTicker = useCallback((tickerToRemove) => {
    setTickers((prev) => prev.filter((t) => t !== tickerToRemove));
  }, []);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [
          ...prev,
          { id: Date.now() + Math.random(), src: event.target.result, caption: '', name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  const handleImageCaptionChange = useCallback((id, caption) => {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption } : img)));
  }, []);

  const handleRemoveImage = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleInsertLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = prompt('Enter URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const buildReportData = useCallback(() => {
    const content = editor?.getHTML() || '';
    const plainText = editor?.getText() || '';
    const excerpt =
      plainText.length > 200 ? plainText.slice(0, 200) + '...' : plainText;
    return {
      title,
      category,
      tags,
      tickers,
      images: images.map(({ src, caption }) => ({ src, caption })),
      content,
      excerpt,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    };
  }, [editor, title, category, tags, tickers, images]);

  const handlePublish = useCallback(() => {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }
    const data = buildReportData();
    if (editId) {
      update(editId, data);
    } else {
      publish(data);
    }
    navigate('/');
  }, [title, editId, buildReportData, publish, update, navigate]);

  const handleSaveDraft = useCallback(() => {
    const content = editor?.getHTML() || '';
    const now = new Date();
    const draft = {
      id: activeDraftId || Date.now().toString(),
      title: title || 'Untitled Draft',
      category,
      tags,
      tickers,
      images,
      content,
      savedAt: now.toISOString(),
    };
    setDrafts((prev) => {
      const existing = prev.findIndex((d) => d.id === draft.id);
      let updated;
      if (existing >= 0) {
        updated = prev.map((d) => (d.id === draft.id ? draft : d));
      } else {
        updated = [draft, ...prev];
      }
      saveDrafts(updated);
      return updated;
    });
    setActiveDraftId(draft.id);
    setSavedMessage('Draft saved');
    setTimeout(() => setSavedMessage(''), 2000);
  }, [editor, title, category, tags, tickers, images, activeDraftId]);

  const handleLoadDraft = useCallback((draft) => {
    setTitle(draft.title || '');
    setCategory(draft.category || '');
    setTags(draft.tags || []);
    setTickers(draft.tickers || []);
    setImages(
      (draft.images || []).map((img, i) => ({
        id: Date.now() + i,
        src: img.src,
        caption: img.caption || '',
        name: img.name || '',
      })),
    );
    if (editor) {
      editor.commands.setContent(draft.content || '');
    }
    setActiveDraftId(draft.id);
  }, [editor]);

  const handleDeleteDraft = useCallback((draftId) => {
    setDrafts((prev) => {
      const updated = prev.filter((d) => d.id !== draftId);
      saveDrafts(updated);
      return updated;
    });
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
  }, [activeDraftId]);

  const currentBlock = !editor
    ? 'p'
    : editor.isActive('heading', { level: 2 })
    ? 'h2'
    : editor.isActive('heading', { level: 3 })
    ? 'h3'
    : editor.isActive('heading', { level: 4 })
    ? 'h4'
    : editor.isActive('blockquote')
    ? 'blockquote'
    : 'p';

  const handleBlockChange = (e) => {
    if (!editor) return;
    const value = e.target.value;
    const chain = editor.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else if (value === 'blockquote') chain.toggleBlockquote().run();
    else if (value.startsWith('h')) {
      const level = Number(value.slice(1));
      chain.setHeading({ level }).run();
    }
  };

  const isActive = (name, attrs) => !!editor?.isActive(name, attrs);

  return (
    <div className="report-writer">
      <div className="rw-header">
        <h2>{editId ? 'Edit Report' : 'Write New Report'}</h2>
        <div className="rw-actions">
          <button className="rw-btn rw-btn-secondary" onClick={handleSaveDraft}>
            Save Draft
          </button>
          {savedMessage && <span className="rw-saved-msg">{savedMessage}</span>}
          <button className="rw-btn rw-btn-primary" onClick={handlePublish}>
            {editId ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Saved Drafts */}
      {drafts.length > 0 && (
        <div className="rw-drafts-panel">
          <div className="rw-drafts-label">Saved Drafts</div>
          <div className="rw-drafts-list">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`rw-draft-item${activeDraftId === draft.id ? ' rw-draft-active' : ''}`}
              >
                <button className="rw-draft-load" onClick={() => handleLoadDraft(draft)}>
                  <span className="rw-draft-title">{draft.title || 'Untitled'}</span>
                  <span className="rw-draft-date">
                    {new Date(draft.savedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </button>
                <button
                  className="rw-draft-delete"
                  title="Delete draft"
                  onClick={() => handleDeleteDraft(draft.id)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <input
        className="rw-title-input"
        type="text"
        placeholder="Report title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Category */}
      <div className="rw-field-row">
        <label className="rw-label">Category</label>
        <select
          className="rw-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category...</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="rw-field-row">
        <label className="rw-label">Tags</label>
        <div className="rw-tag-area">
          {tags.map((tag) => (
            <span key={tag} className="rw-chip">
              {tag}
              <button onClick={() => handleRemoveTag(tag)}>&times;</button>
            </span>
          ))}
          <input
            className="rw-inline-input"
            type="text"
            placeholder="Type a tag and press Enter..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
        </div>
      </div>

      {/* Tickers */}
      <div className="rw-field-row">
        <label className="rw-label">
          Tickers
          <span className="rw-label-hint">Connected to market data feed</span>
        </label>
        <div className="rw-tag-area">
          {tickers.map((ticker) => (
            <span key={ticker} className="rw-chip rw-chip-ticker">
              <span className="rw-ticker-icon">$</span>
              {ticker}
              <button onClick={() => handleRemoveTicker(ticker)}>&times;</button>
            </span>
          ))}
          <input
            className="rw-inline-input"
            type="text"
            placeholder="e.g. AAPL, SPY — press Enter to add..."
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            onKeyDown={handleAddTicker}
          />
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="rw-toolbar">
        <select
          className="rw-block-select"
          value={currentBlock}
          onChange={handleBlockChange}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Blockquote</option>
        </select>

        <div className="rw-toolbar-divider" />

        <button
          className={`rw-toolbar-btn fmt-bold${isActive('bold') ? ' is-active' : ''}`}
          title="Bold"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBold().run();
          }}
        >
          B
        </button>
        <button
          className={`rw-toolbar-btn fmt-italic${isActive('italic') ? ' is-active' : ''}`}
          title="Italic"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleItalic().run();
          }}
        >
          I
        </button>
        <button
          className={`rw-toolbar-btn fmt-underline${isActive('underline') ? ' is-active' : ''}`}
          title="Underline"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleUnderline().run();
          }}
        >
          U
        </button>
        <button
          className={`rw-toolbar-btn fmt-strike${isActive('strike') ? ' is-active' : ''}`}
          title="Strikethrough"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleStrike().run();
          }}
        >
          S
        </button>

        <div className="rw-toolbar-divider" />

        <button
          className={`rw-toolbar-btn${isActive('bulletList') ? ' is-active' : ''}`}
          title="Bulleted List"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBulletList().run();
          }}
        >
          &bull; List
        </button>
        <button
          className={`rw-toolbar-btn${isActive('orderedList') ? ' is-active' : ''}`}
          title="Numbered List"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleOrderedList().run();
          }}
        >
          1. List
        </button>

        <div className="rw-toolbar-divider" />

        <button
          className={`rw-toolbar-btn${isActive('link') ? ' is-active' : ''}`}
          title="Insert Link"
          onMouseDown={(e) => {
            e.preventDefault();
            handleInsertLink();
          }}
        >
          Link
        </button>
      </div>

      {/* Content Editor */}
      <EditorContent editor={editor} className="rw-editor" />

      {/* Image Upload */}
      <div className="rw-images-section">
        <div className="rw-images-header">
          <label className="rw-label">Images</label>
          <button
            className="rw-btn rw-btn-secondary rw-btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            + Add Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleImageUpload}
          />
        </div>

        {images.length > 0 && (
          <div className="rw-image-grid">
            {images.map((img) => (
              <div key={img.id} className="rw-image-card">
                <div className="rw-image-preview">
                  <img src={img.src} alt={img.caption || img.name} />
                  <button
                    className="rw-image-remove"
                    onClick={() => handleRemoveImage(img.id)}
                  >
                    &times;
                  </button>
                </div>
                <input
                  className="rw-caption-input"
                  type="text"
                  placeholder="Add caption (optional)..."
                  value={img.caption}
                  onChange={(e) => handleImageCaptionChange(img.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
