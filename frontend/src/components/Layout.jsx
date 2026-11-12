import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

const BrandLogo = ({ size = 'default' }) => (
  <div className={`brand-logo ${size === 'sm' ? 'sm' : ''}`}>
    <svg width={size === 'sm' ? 22 : 28} height={size === 'sm' ? 22 : 28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
  </div>
);

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSectionClick = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const nav = document.querySelector('.landing-nav');
      const navH = nav ? nav.offsetHeight : 72;
      const top = el.getBoundingClientRect().top + window.pageYOffset - navH + 2;
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.pushState(null, null, '#' + id);
    }
  };

  return (
    <header className="landing-nav">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
          <BrandLogo size="sm" />
          <div className="brand-text-col">
            <span className="brand-name">EasyExam</span>
            <span className="brand-badge-fintech">Fintech &amp; Trading</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-menu">
          <a href="#certifications" className="nav-link" onClick={e => handleSectionClick(e, 'certifications')}>Certifications</a>
          <a href="#features" className="nav-link" onClick={e => handleSectionClick(e, 'features')}>Why EasyExam</a>
          <a href="#reviews" className="nav-link" onClick={e => handleSectionClick(e, 'reviews')}>Wall of Success</a>
        </nav>

        {/* Desktop Auth Actions */}
        <div className="nav-auth-actions desktop-auth-actions">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-outline btn-sm">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary btn-sm">Get Started Free</button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard" className="btn btn-secondary btn-sm">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              <span>Dashboard</span>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-nav-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <nav className="mobile-nav-links">
            <a href="#certifications" className="mobile-nav-link" onClick={e => handleSectionClick(e, 'certifications')}>
              📚 Certifications Catalog
            </a>
            <a href="#features" className="mobile-nav-link" onClick={e => handleSectionClick(e, 'features')}>
              ⚡ Why EasyExam
            </a>
            <a href="#reviews" className="mobile-nav-link" onClick={e => handleSectionClick(e, 'reviews')}>
              🏆 Wall of Success
            </a>
            <Link to="/test/1" className="mobile-nav-link demo-highlight" onClick={() => setMobileMenuOpen(false)}>
              ⏱️ Launch Free Demo Simulator
            </Link>
          </nav>

          <div className="mobile-nav-auth">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn btn-outline btn-block" onClick={() => setMobileMenuOpen(false)}>Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>Get Started Free</button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <Link to="/dashboard" className="btn btn-primary btn-block" onClick={() => setMobileMenuOpen(false)}>
                <span>Go to Student Dashboard</span>
              </Link>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-col-brand">
            <div className="nav-brand">
              <BrandLogo size="sm" />
              <span className="brand-name">EasyExam</span>
            </div>
            <p className="footer-brand-desc">
              India's focused mock test and past exam prep portal for capital markets, algorithmic trading, and quantitative finance certifications.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Certifications</h4>
            <ul className="footer-links">
              <li><a href="#certifications">NISM Series VIII: Equity Derivatives</a></li>
              <li><a href="#certifications">NCFM Algorithmic Trading</a></li>
              <li><a href="#certifications">NISM Series XV: Research Analyst</a></li>
              <li><a href="#certifications">Quantitative Finance &amp; Risk</a></li>
              <li><a href="#certifications">NISM Series XVI: Commodities</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><a href="#features">Exam Simulator</a></li>
              <li><Link to="/login">Student Login</Link></li>
              <li><Link to="/login?tab=register">Register Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} EasyExam Technologies. All rights reserved.</p>
          <p className="disclaimer">Disclaimer: EasyExam is an independent educational prep platform and is not affiliated with or endorsed by NISM, NSE, or SEBI.</p>
        </div>
      </div>
    </footer>
  );
}
