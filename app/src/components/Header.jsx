import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useTruthSocial, {
  requestNotificationPermission,
} from '../hooks/useTruthSocial';
import './Header.css';

const NAV_LINKS = [
  { label: 'Latest', to: '/' },
  { label: 'Write', to: '/write' },
  { label: 'Archive', to: '/archive' },
  { label: 'Links', to: '/links' },
  { label: 'P&L', to: '/pnl' },
];

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Header() {
  const { posts, unreadCount, enabled, setEnabled, markAllRead } =
    useTruthSocial();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  async function handleBellClick() {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (granted) setEnabled(true);
      return;
    }
    setDropdownOpen((prev) => !prev);
    if (!dropdownOpen && unreadCount > 0) markAllRead();
  }

  return (
    <div className="header">
      <div className="header-top">
        <div className="header-center">
          <h1>Market Intelligence</h1>
          <p>Quantitative analysis &amp; derivatives strategy</p>
        </div>
        <div className="truth-bell" ref={dropdownRef}>
          <button
            className={`bell-btn${unreadCount > 0 ? ' has-unread' : ''}`}
            onClick={handleBellClick}
            title={
              enabled
                ? 'Trump Truth Social notifications'
                : 'Enable Truth Social notifications'
            }
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="bell-badge">{unreadCount}</span>
            )}
          </button>

          {dropdownOpen && (
            <div className="truth-dropdown">
              <div className="truth-dropdown-header">
                <span>Truth Social — @realDonaldTrump</span>
                <button
                  className="truth-toggle"
                  onClick={() => setEnabled(!enabled)}
                >
                  {enabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {posts.length === 0 ? (
                <div className="truth-empty">No posts loaded yet</div>
              ) : (
                <ul className="truth-posts">
                  {posts.slice(0, 5).map((post) => (
                    <li key={post.id}>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="truth-post-text">
                          {post.content.length > 120
                            ? post.content.slice(0, 120) + '...'
                            : post.content}
                        </span>
                        <span className="truth-post-time">
                          {formatTimeAgo(post.createdAt)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <nav>
        {NAV_LINKS.map((link) =>
          link.to.startsWith('/') ? (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ) : (
            <a key={link.label} href={link.to}>
              {link.label}
            </a>
          ),
        )}
      </nav>
    </div>
  );
}
