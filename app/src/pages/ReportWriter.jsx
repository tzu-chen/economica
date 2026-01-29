import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../context/ReportsContext';
import './ReportWriter.css';

const CATEGORIES = ['Equities', 'Fixed Income', 'Commodities', 'Options', 'Strategy', 'Macro'];

const FORMATTING_BUTTONS = [
  { command: 'bold', icon: 'B', title: 'Bold', className: 'fmt-bold' },
  { command: 'italic', icon: 'I', title: 'Italic', className: 'fmt-italic' },
  { command: 'underline', icon: 'U', title: 'Underline', className: 'fmt-underline' },
  { command: 'strikeThrough', icon: 'S', title: 'Strikethrough', className: 'fmt-strike' },
];

const BLOCK_FORMATS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'blockquote', label: 'Blockquote' },
];

export default function ReportWriter() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tickers, setTickers] = useState([]);
  const [tickerInput, setTickerInput] = useState('');
  const [images, setImages] = useState([]);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { publish } = useReports();

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleBlockFormat = useCallback((e) => {
    const tag = e.target.value;
    if (tag === 'blockquote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else {
      document.execCommand('formatBlock', false, tag);
    }
    editorRef.current?.focus();
  }, []);

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
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const handlePublish = useCallback(() => {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }
    const content = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';
    const excerpt =
      plainText.length > 200 ? plainText.slice(0, 200) + '...' : plainText;
    const report = {
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
    publish(report);
    navigate('/');
  }, [title, category, tags, tickers, images, publish, navigate]);

  const handleSaveDraft = useCallback(() => {
    const content = editorRef.current?.innerHTML || '';
    const draft = { title, category, tags, tickers, images, content };
    localStorage.setItem('reportDraft', JSON.stringify(draft));
    alert('Draft saved.');
  }, [title, category, tags, tickers, images]);

  return (
    <div className="report-writer">
      <div className="rw-header">
        <h2>Write New Report</h2>
        <div className="rw-actions">
          <button className="rw-btn rw-btn-secondary" onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button className="rw-btn rw-btn-primary" onClick={handlePublish}>
            Publish
          </button>
        </div>
      </div>

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
        <select className="rw-block-select" onChange={handleBlockFormat} defaultValue="p">
          {BLOCK_FORMATS.map((fmt) => (
            <option key={fmt.value} value={fmt.value}>
              {fmt.label}
            </option>
          ))}
        </select>

        <div className="rw-toolbar-divider" />

        {FORMATTING_BUTTONS.map((btn) => (
          <button
            key={btn.command}
            className={`rw-toolbar-btn ${btn.className}`}
            title={btn.title}
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(btn.command);
            }}
          >
            {btn.icon}
          </button>
        ))}

        <div className="rw-toolbar-divider" />

        <button
          className="rw-toolbar-btn"
          title="Bulleted List"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('insertUnorderedList');
          }}
        >
          &bull; List
        </button>
        <button
          className="rw-toolbar-btn"
          title="Numbered List"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('insertOrderedList');
          }}
        >
          1. List
        </button>

        <div className="rw-toolbar-divider" />

        <button
          className="rw-toolbar-btn"
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
      <div
        ref={editorRef}
        className="rw-editor"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing your report..."
      />

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
