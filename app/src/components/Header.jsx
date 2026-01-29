import './Header.css';

const NAV_LINKS = ['Latest', 'Archive', 'Performance', 'Data', 'About'];

export default function Header() {
  return (
    <div className="header">
      <h1>Market Intelligence</h1>
      <p>Quantitative analysis &amp; derivatives strategy</p>
      <nav>
        {NAV_LINKS.map((link) => (
          <a key={link} href="#">
            {link}
          </a>
        ))}
      </nav>
    </div>
  );
}
