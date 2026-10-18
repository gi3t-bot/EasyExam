import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components/Layout';
import { certifications, reviews, features } from '../data/certifications';

// ── Icons ────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);

const FeatureIcon = ({ type }) => {
  const icons = {
    monitor: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>,
    calculator: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>,
    alert: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    refresh: <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>,
  };
  return icons[type] || null;
};

// ── Hero Section ─────────────────────────────────────────────────
function HeroSection({ onSearch, searchQuery, setSearchQuery }) {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-tag-badge">
          <span className="pulse-dot"></span>
          <span>Annual Certifications Prep • NISM, NCFM &amp; Quant Finance</span>
        </div>

        <h1 className="hero-title">
          Master Your <span className="gradient-text">Capital Markets</span> &amp; <br />
          <span className="gradient-text">Algorithmic Trading</span> Certifications
        </h1>

        <p className="hero-desc">
          High-yield timed mock tests, previous year papers (PYQs), and detailed quantitative solutions built specifically for proprietary traders, research analysts, and fintech professionals.
        </p>

        <div className="hero-search-wrapper">
          <div className="search-input-group">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              id="examSearchInput"
              placeholder="Search certifications (e.g. NISM Series VIII, Algo Trading, Research Analyst...)"
              autoComplete="off"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="button" className="btn btn-primary search-btn" onClick={onSearch}>
              <span>Search Mocks</span>
            </button>
          </div>
        </div>

        <div className="hero-stats-row">
          <div className="stat-item">
            <span className="stat-num">50,000+</span>
            <span className="stat-lbl">Mock Tests Taken</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">99.2%</span>
            <span className="stat-lbl">Pass Rate</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">1-Year</span>
            <span className="stat-lbl">Updated Validity</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-num">100%</span>
            <span className="stat-lbl">Real Test Engine UI</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Exam Card ────────────────────────────────────────────────────
function ExamCard({ exam }) {
  return (
    <div className="exam-card" data-category={exam.category}>
      <div>
        <div className="card-top-row">
          <span className="cat-label">{exam.category_label}</span>
          <span className="validity-badge">{exam.validity}</span>
        </div>

        <h3 className="exam-card-title">{exam.title}</h3>
        <p className="exam-card-subtitle">{exam.subtitle}</p>

        <div className="exam-specs-grid">
          <div className="spec-pill">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            <span>{exam.questions_count}</span>
          </div>
          <div className="spec-pill">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{exam.duration}</span>
          </div>
          <div className="spec-pill">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Pass: {exam.passing_score}</span>
          </div>
          <div className="spec-pill danger-pill">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>{exam.negative_marking}</span>
          </div>
        </div>

        <div className="card-materials-meta">
          <div className="materials-tags">
            <span className="materials-dot"></span>
            <span>{exam.mock_tests_count} Full Mocks</span>
            <span className="separator">•</span>
            <span>{exam.pyqs_count} Solved PYQs</span>
          </div>
          <div className="rating-badge">★ {exam.rating} ({exam.enrolled_count})</div>
        </div>
      </div>

      <div className="card-action-buttons">
        <Link to="/login?tab=register" className="btn btn-outline btn-block">
          <span>Free Demo Mock</span>
        </Link>
        <Link to="/login?tab=register" className="btn btn-primary btn-block">
          <span>Enroll Series</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </Link>
      </div>
    </div>
  );
}

// ── Certifications Section ────────────────────────────────────────
function CertificationsSection({ visibleCerts }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { key: 'all', label: 'All Certifications' },
    { key: 'derivatives', label: 'Securities & Derivatives' },
    { key: 'quant', label: 'Algorithmic & Quant Finance' },
    { key: 'research', label: 'Research Analyst' },
    { key: 'portfolio', label: 'Portfolio Management' },
  ];

  const filtered = visibleCerts.filter(c => activeCategory === 'all' || c.category === activeCategory);

  return (
    <section className="certifications-section" id="certifications">
      <div className="section-container">
        <div className="section-header text-center">
          <h2 className="section-heading">Featured Test Series</h2>
          <p className="section-subtext">Choose your target annual assessment to start practicing timed simulated mock tests</p>
        </div>

        <div className="category-pills-bar">
          {categories.map(cat => (
            <button
              key={cat.key}
              type="button"
              className={`cat-pill${activeCategory === cat.key ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="exam-cards-grid" id="examCardsGrid">
          {filtered.map(exam => <ExamCard key={exam.id} exam={exam} />)}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '40px 0' }}>
              No certifications found. Try a different search.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Features Section ──────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="features-pill-tag">Engineered for Trading Desks</span>
          <h2 className="section-heading">Why Fintech &amp; Trading Professionals Choose EasyExam</h2>
          <p className="section-subtext">Built to simulate real exchange and certification environments with pinpoint accuracy</p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon-box"><FeatureIcon type={f.icon} /></div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Reviews Section ───────────────────────────────────────────────
import { useEffect, useRef } from 'react';

function ReviewsSection() {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const targetXRef = useRef(0);
  const currentXRef = useRef(0);

  useEffect(() => {
    const pinSection = sectionRef.current;
    const track = trackRef.current;
    if (!pinSection || !track) return;

    const updatePosition = () => {
      const nav = document.querySelector('.landing-nav');
      const navH = nav ? nav.offsetHeight : 72;
      const stickyViewport = pinSection.querySelector('.reviews-sticky-viewport');
      const sectionRect = pinSection.getBoundingClientRect();
      const scrollableDistance = pinSection.offsetHeight - (stickyViewport ? stickyViewport.offsetHeight : 0);
      const scrolled = navH - sectionRect.top;
      let progress = 0;
      if (scrollableDistance > 0) progress = Math.min(Math.max(scrolled / scrollableDistance, 0), 1);
      const viewportWidth = window.innerWidth;
      const maxH = Math.max(0, track.scrollWidth - viewportWidth + 96);
      targetXRef.current = -(progress * maxH);
    };

    const loop = () => {
      currentXRef.current += (targetXRef.current - currentXRef.current) * 0.12;
      track.style.transform = `translate3d(${currentXRef.current}px, 0, 0)`;
      animRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition);
    updatePosition();
    animRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <section className="reviews-pinned-section" id="reviews" ref={sectionRef}>
      <div className="reviews-sticky-viewport">
        <div className="reviews-header-container">
          <span className="features-pill-tag">Wall of Success</span>
          <h2 className="section-heading">Trusted by Traders &amp; Quantitative Analysts</h2>
          <p className="section-subtext">Hear from candidates who cleared their regulatory certifications on attempt #1</p>
        </div>

        <div className="reviews-horizontal-window" id="reviewsMarquee">
          <div className="reviews-horizontal-track" id="reviewsTrack" ref={trackRef}>
            {reviews.map(r => (
              <div className="review-card" key={r.id}>
                <div className="review-top-bar">
                  <div className="review-stars">{r.stars}</div>
                  <span className={`review-exam-tag ${r.tagClass}`}>{r.tag}</span>
                </div>
                <p className="review-quote">{r.quote}</p>
                <div className="reviewer-meta">
                  <div className="reviewer-profile">
                    <div className={`reviewer-avatar ${r.avatarClass}`}>{r.initials}</div>
                    <div>
                      <div className="reviewer-name">{r.name}</div>
                      <div className="reviewer-role">{r.role}</div>
                    </div>
                  </div>
                  <span className="reviewer-score-badge">{r.score}</span>
                </div>
              </div>
            ))}
            {/* CTA Card */}
            <div className="review-card review-cta-card">
              <div className="cta-card-icon">⚡</div>
              <h3 className="cta-card-title">Join 15,000+ Certified Fintech Professionals</h3>
              <p className="cta-card-desc">Prepare with realistic timed mock test engines, step-by-step quant formulas, and negative marking drills.</p>
              <Link to="/login?tab=register" className="btn btn-primary btn-block">
                <span>Start Free Demo Mock</span>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="cta-banner-section">
      <div className="cta-container">
        <div className="cta-card">
          <h2 className="cta-heading">Ready to Ace Your Trading Certification?</h2>
          <p className="cta-sub">Start practicing with our free demo mocks right away. No payment required to test the interface.</p>
          <div className="cta-actions">
            <Link to="/login?tab=register" className="btn btn-lg">
              <span>Get Started Free</span>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Home Page (main export) ──────────────────────────────────────
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCerts, setVisibleCerts] = useState(certifications);

  const handleSearch = useCallback(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) { setVisibleCerts(certifications); return; }
    setVisibleCerts(certifications.filter(c =>
      c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)
    ));
  }, [searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) setVisibleCerts(certifications);
    else handleSearch();
  }, [searchQuery, handleSearch]);

  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection onSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CertificationsSection visibleCerts={visibleCerts} />
      <FeaturesSection />
      <ReviewsSection />
      <CTABanner />
      <Footer />
    </div>
  );
}
