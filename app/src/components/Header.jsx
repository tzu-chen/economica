import { Link } from 'react-router-dom';
import './Header.css';

const NAV_LINKS = [
  { label: 'Latest', to: '/' },
  { label: 'Write', to: '/write' },
  { label: 'Archive', to: '#' },
  { label: 'Performance', to: '#' },
  { label: 'Data', to: '#' },
  { label: 'About', to: '#' },
];

export default function Header() {
  return (
    <div className="header">
      <h1>Market Intelligence</h1>
      <p>Quantitative analysis &amp; derivatives strategy</p>
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
