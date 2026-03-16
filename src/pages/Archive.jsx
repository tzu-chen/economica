import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useReports } from '../context/ReportsContext';
import ReportCard from '../components/ReportCard';
import './Archive.css';

export default function Archive() {
  const { archivedReports, remove } = useReports();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');

  // Collect all unique categories, tags, and tickers from archived reports
  const { categories, tags, tickers } = useMemo(() => {
    const cats = new Set();
    const tagSet = new Set();
    const tickerSet = new Set();
    archivedReports.forEach((r) => {
      if (r.category) cats.add(r.category);
      (r.tags || []).forEach((t) => tagSet.add(t));
      (r.tickers || []).forEach((t) => tickerSet.add(t));
    });
    return {
      categories: [...cats].sort(),
      tags: [...tagSet].sort(),
      tickers: [...tickerSet].sort(),
    };
  }, [archivedReports]);

  const filtered = useMemo(() => {
    let results = archivedReports;

    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.excerpt || '').toLowerCase().includes(q) ||
          (r.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (r.tickers || []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (selectedCategory) {
      results = results.filter((r) => r.category === selectedCategory);
    }

    if (selectedTag) {
      results = results.filter((r) => (r.tags || []).includes(selectedTag));
    }

    if (selectedTicker) {
      results = results.filter((r) => (r.tickers || []).includes(selectedTicker));
    }

    return results;
  }, [archivedReports, search, selectedCategory, selectedTag, selectedTicker]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedTicker('');
  };

  const hasActiveFilters = search || selectedCategory || selectedTag || selectedTicker;

  return (
    <div className="archive-page">
      <div className="archive-header">
        <h2>Archive</h2>
        <p className="archive-subtitle">
          {archivedReports.length} archived report{archivedReports.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="archive-search">
        <input
          className="archive-search-input"
          type="text"
          placeholder="Search archived reports by title, content, tags, or tickers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="archive-layout">
        {/* Sidebar with filters */}
        <aside className="archive-sidebar">
          <div className="archive-filter-section">
            <h4 className="archive-filter-title">Category</h4>
            <ul className="archive-filter-list">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat}>
                    <button
                      className={`archive-filter-item ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                    >
                      {cat}
                    </button>
                  </li>
                ))
              ) : (
                <li className="archive-filter-empty">No categories</li>
              )}
            </ul>
          </div>

          <div className="archive-filter-section">
            <h4 className="archive-filter-title">Tags</h4>
            <ul className="archive-filter-list">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <li key={tag}>
                    <button
                      className={`archive-filter-item ${selectedTag === tag ? 'active' : ''}`}
                      onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    >
                      {tag}
                    </button>
                  </li>
                ))
              ) : (
                <li className="archive-filter-empty">No tags</li>
              )}
            </ul>
          </div>

          <div className="archive-filter-section">
            <h4 className="archive-filter-title">Tickers</h4>
            <ul className="archive-filter-list">
              {tickers.length > 0 ? (
                tickers.map((ticker) => (
                  <li key={ticker}>
                    <button
                      className={`archive-filter-item archive-filter-ticker ${selectedTicker === ticker ? 'active' : ''}`}
                      onClick={() => setSelectedTicker(selectedTicker === ticker ? '' : ticker)}
                    >
                      ${ticker}
                    </button>
                  </li>
                ))
              ) : (
                <li className="archive-filter-empty">No tickers</li>
              )}
            </ul>
          </div>

          {hasActiveFilters && (
            <button className="archive-clear-btn" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </aside>

        {/* Results */}
        <div className="archive-results">
          {filtered.length > 0 ? (
            <div className="reports-section">
              {filtered.map((report, i) => (
                <ReportCard key={report.id || report.title + i} report={report} onDelete={remove} />
              ))}
            </div>
          ) : archivedReports.length === 0 ? (
            <div className="archive-empty">
              <p>No archived reports yet.</p>
              <Link to="/" className="archive-home-link">&larr; Back to Home</Link>
            </div>
          ) : (
            <div className="archive-empty">
              <p>No reports match your filters.</p>
              <button className="archive-clear-link" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
