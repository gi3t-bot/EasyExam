import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser, UserButton } from "@clerk/clerk-react";
import "../dashboard.css";
import { useAuth } from "@clerk/clerk-react";

// ── Mock Dashboard Data ───────────────────────────────────────────
const availableExams = [
  { code: "NISM-VIII", name: "NISM Series VIII: Equity Derivatives" },
  { code: "NCFM-AT", name: "NCFM Algorithmic Trading" },
  { code: "NISM-XV", name: "NISM Series XV: Research Analyst" },
  { code: "QF-RISK", name: "Quantitative Finance & Risk" },
  { code: "NISM-XVI", name: "NISM Series XVI: Commodity Derivatives" },
];

const mockCourses = [
  {
    id: 1,
    category: "live",
    title: "Options Greeks & Delta Hedging — Live Batch",
    subtitle: "Complete NISM Series VIII prep with live doubt sessions",
    badge: "LIVE",
    badge_class: "badge-live",
    features: ["25 Full Mocks", "Live Sessions", "PDF Notes"],
    language: "English/Hindi",
    rating: "4.9",
    enrolled: "12.4k",
    instructors: [
      { name: "Rohan Tyagi", role: "Options Strategist", avatar: "RT" },
    ],
  },
  {
    id: 2,
    category: "quant",
    title: "Black-Scholes & VaR — Quantitative Finance Course",
    subtitle:
      "Advanced mathematical finance with step-by-step formula derivations",
    badge: "NEW",
    badge_class: "badge-new",
    features: ["80 Practice Questions", "Formula Sheets", "Video Explanations"],
    language: "English",
    rating: "4.8",
    enrolled: "5.1k",
    instructors: [{ name: "Priya Sen", role: "Quant Analyst", avatar: "PS" }],
  },
  {
    id: 3,
    category: "mocks",
    title: "Full Mock Test Discussion Series (10 Mocks)",
    subtitle:
      "Detailed video walkthrough of all 10 official-pattern mock tests",
    badge: "Popular",
    badge_class: "badge-popular",
    features: ["10 Mock Tests", "Video Discussions", "Answer Keys"],
    language: "English",
    rating: "4.9",
    enrolled: "8.7k",
    instructors: [
      { name: "Aditya Mehta", role: "NISM Trainer", avatar: "AM" },
      { name: "Sneha Rao", role: "Risk Analyst", avatar: "SR" },
    ],
  },
  {
    id: 4,
    category: "crash",
    title: "Fast-Track 7-Day Sprint — Last Minute Prep",
    subtitle:
      "Intensive revision covering high-frequency exam topics in 7 days",
    badge: "Recorded",
    badge_class: "badge-recorded",
    features: ["7-Day Plan", "PYQ Focus", "Revision Notes"],
    language: "Hindi",
    rating: "4.7",
    enrolled: "3.2k",
    instructors: [
      { name: "Kavya Iyer", role: "Sr. NISM Faculty", avatar: "KI" },
    ],
  },
];

const mockTests = [
  {
    id: 1,
    title: "Full Mock Test 01 — Official Pattern (100 Qs)",
    free: true,
    questions: 100,
    duration: "120 mins",
    marks: "100 Marks",
    negative: "0.25",
  },
  {
    id: 2,
    title: "Full Mock Test 02 — Section-wise Analysis",
    free: true,
    questions: 100,
    duration: "120 mins",
    marks: "100 Marks",
    negative: "0.25",
  },
  {
    id: 3,
    title: "Full Mock Test 03 — Previous Year Pattern",
    free: false,
    questions: 100,
    duration: "120 mins",
    marks: "100 Marks",
    negative: "0.25",
  },
  {
    id: 4,
    title: "Full Mock Test 04 — High Difficulty Simulation",
    free: false,
    questions: 100,
    duration: "120 mins",
    marks: "100 Marks",
    negative: "0.25",
  },
  {
    id: 5,
    title: "Full Mock Test 05 — Options & Derivatives Focus",
    free: false,
    questions: 100,
    duration: "120 mins",
    marks: "100 Marks",
    negative: "0.25",
  },
  {
    id: 6,
    title: "Full Mock Test 06 — Regulatory Acts Deep Dive",
    free: false,
    questions: 100,
    duration: "120 mins",
    marks: "100 Marks",
    negative: "0.25",
  },
];

const notifications = [
  {
    id: 1,
    iconClass: "notif-icon-live",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        ></path>
      </svg>
    ),
    title: "Live Options Greeks Class Starts Today",
    desc: "NISM Series VIII live doubt clearing & numerical drill session at 7:00 PM.",
    tag: "Live Class",
    tagClass: "tag-live",
    time: "15 mins ago",
    unread: true,
    tab: "demo-classes",
  },
  {
    id: 2,
    iconClass: "notif-icon-mock",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
    ),
    title: "2 Full Mock Tests Added to Your Series",
    desc: "Simulated tests 07 & 08 with official 25% negative marking are now available.",
    tag: "Test Series",
    tagClass: "tag-mock",
    time: "2 hours ago",
    unread: true,
    tab: "test-series",
  },
  {
    id: 3,
    iconClass: "notif-icon-doc",
    icon: (
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        ></path>
      </svg>
    ),
    title: "Options Greeks Formula Cheat Sheet (2025)",
    desc: "Updated mathematical formula sheet with Put-Call parity and Delta hedging formulas.",
    tag: "Resource",
    tagClass: "tag-doc",
    time: "1 day ago",
    unread: false,
    tab: "free-resources",
  },
];

// ── Dashboard Navbar ──────────────────────────────────────────────
function DashboardNavbar({ currentExam, onExamChange, onTabChange }) {
  const navigate = useNavigate();
  const [examDropOpen, setExamDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const [searchQuery, setSearchQuery] = useState("");
  const examRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (examRef.current && !examRef.current.contains(e.target))
        setExamDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifList.filter((n) => n.unread).length;
  const markAllRead = () =>
    setNotifList((n) => n.map((notif) => ({ ...notif, unread: false })));

  return (
    <header className="super-nav">
      <div className="super-nav-container">
        {/* Left: Brand & Exam Selector */}
        <div className="super-nav-left">
          <Link to="/" className="super-brand">
            <div className="brand-glyph">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                ></path>
              </svg>
            </div>
            <span className="super-brand-logo-text">
              EasyExam<span className="brand-accent-dot">.</span>
            </span>
            <span className="brand-tag-edition">PRO</span>
          </Link>

          <div className="exam-selector-wrapper" ref={examRef}>
            <button
              type="button"
              className="exam-selector-btn"
              onClick={() => setExamDropOpen((v) => !v)}
            >
              <span>{currentExam.code} 2025</span>
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>
            <div
              className={`exam-dropdown-menu${examDropOpen ? "" : " hidden"}`}
            >
              <div className="exam-dropdown-header">
                Select Certification Course
              </div>
              {availableExams.map((ex) => (
                <div
                  key={ex.code}
                  className={`exam-dropdown-item${ex.code === currentExam.code ? " active" : ""}`}
                  onClick={() => {
                    onExamChange(ex);
                    setExamDropOpen(false);
                  }}
                >
                  <span>{ex.name}</span>
                  {ex.code === currentExam.code && (
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="super-nav-search">
          <input
            type="text"
            className="super-search-input"
            placeholder="Search courses, test series, study notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="super-search-icon">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
        </div>

        {/* Right */}
        <div className="super-nav-right">
          <div className="nav-pass-active">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Pass Active</span>
          </div>

          {/* Notifications */}
          <div className="nav-notifications-wrapper" ref={notifRef}>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => setNotifOpen((v) => !v)}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              {unreadCount > 0 && (
                <span className="nav-unread-dot" id="notifUnreadDot"></span>
              )}
            </button>
            <div
              className={`nav-notifications-menu${notifOpen ? "" : " hidden"}`}
            >
              <div className="notif-header">
                <div className="notif-header-title">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="notif-badge-count">{unreadCount} New</span>
                  )}
                </div>
                <button
                  type="button"
                  className="notif-mark-read-btn"
                  onClick={markAllRead}
                >
                  Mark all as read
                </button>
              </div>
              <div className="notif-list">
                {notifList.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item${n.unread ? " unread" : ""}`}
                    onClick={() => {
                      onTabChange(n.tab);
                      setNotifOpen(false);
                    }}
                  >
                    <div className={`notif-icon-circle ${n.iconClass}`}>
                      {n.icon}
                    </div>
                    <div className="notif-content-col">
                      <div className="notif-item-title">{n.title}</div>
                      <div className="notif-item-desc">{n.desc}</div>
                      <div className="notif-item-meta">
                        <span className={`notif-item-tag ${n.tagClass}`}>
                          {n.tag}
                        </span>
                        <span>• {n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notif-footer">
                <a
                  href="#"
                  className="notif-footer-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onTabChange("test-series");
                    setNotifOpen(false);
                  }}
                >
                  View All Exam Updates →
                </a>
              </div>
            </div>
          </div>

          {/* Clerk User Profile & Sign Out */}
          <div
            className="nav-profile-wrapper"
            style={{ display: "flex", alignItems: "center" }}
          >
            <UserButton afterSignOutUrl="/" showName />
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Dashboard Hero ────────────────────────────────────────────────
function DashboardHero({ currentExam, onTabChange }) {
  return (
    <section className="super-hero-section">
      <div className="super-hero-container">
        {/* Left: Hero Banner */}
        <div className="super-banner-card prep-hero-card">
          <div className="prep-hero-content">
            <div className="prep-hero-badge">
              <span>Practice</span> • Prepare • Succeed
            </div>
            <h1 className="prep-hero-title">
              Your Exam Preparation
              <br />
              <span className="prep-title-highlight">Starts Here</span>
            </h1>
            <p className="prep-hero-subtitle">
              Take mock tests, practice questions, and track your progress for{" "}
              {currentExam.code} — all in one place.
            </p>
            <div className="prep-hero-actions">
              <a
                href="#test-series"
                className="prep-hero-cta"
                onClick={() => onTabChange("test-series")}
              >
                <span>Start Practicing</span>
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  ></path>
                </svg>
              </a>
            </div>
          </div>
          <div className="prep-hero-illustration" aria-hidden="true">
            <svg
              className="prep-illustration-svg"
              viewBox="0 0 420 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="cardBgGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#4F46E5" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0" />
                </radialGradient>
                <linearGradient
                  id="laptopLid"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#312E81" />
                  <stop offset="50%" stopColor="#1E1B4B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient
                  id="screenDisplay"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#161438" />
                  <stop offset="100%" stopColor="#0E0C22" />
                </linearGradient>
                <linearGradient
                  id="laptopBase"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3730A3" />
                  <stop offset="50%" stopColor="#1E1B4B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient
                  id="leafGrad1"
                  x1="0%"
                  y1="100%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#064E3B" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient
                  id="leafGrad2"
                  x1="0%"
                  y1="100%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <linearGradient
                  id="checkBg"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#064E3B" />
                  <stop offset="100%" stopColor="#022C22" />
                </linearGradient>
                <linearGradient
                  id="bookCoverBlue2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient
                  id="bookCoverAmber2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
                <linearGradient
                  id="bookCoverPurple2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#6D28D9" />
                  <stop offset="100%" stopColor="#5B21B6" />
                </linearGradient>
                <linearGradient
                  id="capTop2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#312E81" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient
                  id="screenBezel2"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#1E1B4B" />
                </linearGradient>
              </defs>
              <ellipse
                cx="230"
                cy="155"
                rx="150"
                ry="110"
                fill="url(#cardBgGlow)"
              />
              <g opacity="0.95">
                <path
                  d="M72 175 C58 150 48 115 62 82 C68 102 78 122 84 140 C80 152 76 164 72 175Z"
                  fill="url(#leafGrad1)"
                />
                <path
                  d="M52 142 C30 132 18 112 24 92 C38 98 48 114 54 130 Z"
                  fill="url(#leafGrad2)"
                />
                <path
                  d="M80 128 C88 104 102 90 118 84 C112 100 102 118 90 132 Z"
                  fill="url(#leafGrad2)"
                />
                <path
                  d="M68 98 C58 75 62 52 76 40 C80 58 78 78 74 94 Z"
                  fill="url(#leafGrad1)"
                />
              </g>
              <ellipse
                cx="232"
                cy="242"
                rx="160"
                ry="14"
                fill="#040714"
                opacity="0.65"
              />
              <g>
                <path
                  d="M100 226 L300 226 C306 226 312 230 310 236 L302 244 C300 246 294 248 288 248 L112 248 C106 248 100 246 98 244 L90 236 C88 230 94 226 100 226 Z"
                  fill="url(#laptopBase)"
                />
                <rect
                  x="122"
                  y="68"
                  width="166"
                  height="158"
                  rx="10"
                  fill="url(#screenBezel2)"
                  stroke="#6366F1"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
                <rect
                  x="130"
                  y="76"
                  width="150"
                  height="142"
                  rx="6"
                  fill="url(#screenDisplay)"
                />
                <g>
                  <rect
                    x="144"
                    y="94"
                    width="18"
                    height="18"
                    rx="4"
                    fill="url(#checkBg)"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M148 103 L152 107 L158 99"
                    stroke="#34D399"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="170"
                    y="97"
                    width="94"
                    height="6"
                    rx="3"
                    fill="#6366F1"
                    opacity="0.8"
                  />
                  <rect
                    x="170"
                    y="106"
                    width="62"
                    height="4"
                    rx="2"
                    fill="#475569"
                    opacity="0.5"
                  />
                </g>
                <g>
                  <rect
                    x="144"
                    y="126"
                    width="18"
                    height="18"
                    rx="4"
                    fill="url(#checkBg)"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M148 135 L152 139 L158 131"
                    stroke="#34D399"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="170"
                    y="129"
                    width="84"
                    height="6"
                    rx="3"
                    fill="#6366F1"
                    opacity="0.8"
                  />
                  <rect
                    x="170"
                    y="138"
                    width="50"
                    height="4"
                    rx="2"
                    fill="#475569"
                    opacity="0.5"
                  />
                </g>
                <g>
                  <rect
                    x="144"
                    y="158"
                    width="18"
                    height="18"
                    rx="4"
                    fill="url(#checkBg)"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M148 167 L152 171 L158 163"
                    stroke="#34D399"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect
                    x="170"
                    y="161"
                    width="90"
                    height="6"
                    rx="3"
                    fill="#6366F1"
                    opacity="0.8"
                  />
                </g>
                <rect
                  x="144"
                  y="196"
                  width="122"
                  height="4"
                  rx="2"
                  fill="#1E1B4B"
                />
                <rect
                  x="144"
                  y="196"
                  width="88"
                  height="4"
                  rx="2"
                  fill="url(#leafGrad2)"
                />
              </g>
              <g>
                <rect
                  x="272"
                  y="218"
                  width="82"
                  height="16"
                  rx="3"
                  fill="url(#bookCoverBlue2)"
                  stroke="#1E40AF"
                  strokeWidth="1"
                />
                <rect
                  x="278"
                  y="198"
                  width="76"
                  height="15"
                  rx="3"
                  fill="url(#bookCoverAmber2)"
                  stroke="#B45309"
                  strokeWidth="1"
                />
                <rect
                  x="275"
                  y="179"
                  width="74"
                  height="14"
                  rx="3"
                  fill="url(#bookCoverPurple2)"
                  stroke="#5B21B6"
                  strokeWidth="1"
                />
              </g>
              <g>
                <polygon
                  points="230,48 274,34 318,48 274,62"
                  fill="url(#capTop2)"
                  stroke="#6366F1"
                  strokeWidth="1.2"
                />
                <ellipse
                  cx="274"
                  cy="48"
                  rx="3.5"
                  ry="2.5"
                  fill="#F59E0B"
                  stroke="#D97706"
                  strokeWidth="0.8"
                />
                <path
                  d="M274 48 C286 52 304 56 308 72 C310 82 311 96 312 110"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Right: Plan Card */}
        <div className="super-plan-card">
          <div>
            <div className="offers-header">
              <h2 className="offers-title">Special Offers for You!</h2>
              <button type="button" className="offers-coupon-link">
                Apply Coupon
              </button>
            </div>
            <div className="coupon-banner-box">
              <div className="coupon-icon">
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <div className="coupon-text-col">
                <div className="coupon-code-name">PRODESK100 Applied</div>
                <div className="coupon-desc">
                  100% Free Full Certification Access Active
                </div>
              </div>
              <svg width="18" height="18" fill="#10b981" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            <div className="plan-select-section">
              <div className="plan-select-header">
                <span className="plan-select-title">Select your plan</span>
                <button
                  type="button"
                  className="plan-see-all"
                  onClick={() => onTabChange("pricing")}
                >
                  See All Plans &gt;
                </button>
              </div>
              <div className="plan-options-container">
                <div className="plan-option-item selected">
                  <label className="plan-radio-label">
                    <input type="radio" name="plan" defaultChecked />
                    <span>1-Year Full Pass (All 25 Mocks + Videos)</span>
                  </label>
                  <span className="plan-price-tag">₹0</span>
                </div>
                <div className="plan-option-item">
                  <label className="plan-radio-label">
                    <input type="radio" name="plan" />
                    <span>6-Month Fast-Track Sprint Batch</span>
                  </label>
                  <span className="plan-price-tag">₹0</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="payment-summary-row">
              <span className="payment-label">
                <span>Amount to be paid</span>
              </span>
              <div>
                <span className="payment-original">₹4,999</span>
                <span className="payment-amount">₹0</span>
              </div>
            </div>
            <button type="button" className="btn-claim-free">
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>Claim For Free</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Sub Navigation ────────────────────────────────────────────────
const TABS = [
  { key: "courses", label: "Courses" },
  { key: "test-series", label: "Test Series" },
  { key: "free-resources", label: "Free Tests" },
  { key: "study-notes", label: "Study Notes" },
];

function SubNav({ activeTab, onTabChange }) {
  return (
    <nav className="super-subnav-wrapper">
      <div className="super-subnav-container">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`subnav-tab-btn${activeTab === t.key ? " active" : ""}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── Tab: Courses ──────────────────────────────────────────────────
function CoursesTab() {
  const [activeCat, setActiveCat] = useState("all");
  const cats = [
    { key: "all", label: "All Courses" },
    { key: "live", label: "Live Courses" },
    { key: "quant", label: "Quant & Options Math" },
    { key: "mocks", label: "Mock Test Discussions" },
    { key: "crash", label: "Fast-Track Sprints" },
  ];
  const filtered = mockCourses.filter(
    (c) => activeCat === "all" || c.category === activeCat,
  );

  return (
    <div>
      <div className="section-top-bar">
        <h2 className="section-main-heading">
          5+ Specialized Certification Courses
        </h2>
      </div>
      <div className="section-layout-grid">
        <aside className="category-filter-sidebar">
          {cats.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`category-pill-btn${activeCat === cat.key ? " active" : ""}`}
              onClick={() => setActiveCat(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </aside>
        <div className="courses-cards-container" id="coursesListContainer">
          {filtered.map((course) => (
            <div key={course.id} className="course-card-item">
              <div className="course-thumb-box">
                <span className={`course-badge-pill ${course.badge_class}`}>
                  {course.badge}
                </span>
                <div className="thumb-title">{course.title}</div>
                <div className="thumb-mentor-chips">
                  {course.instructors.map((m) => (
                    <div
                      key={m.name}
                      className="thumb-mentor-avatar"
                      title={`${m.name} (${m.role})`}
                    >
                      {m.avatar}
                    </div>
                  ))}
                </div>
              </div>
              <div className="course-info-col">
                <div>
                  <div className="course-header-row">
                    <h3 className="course-title-text">{course.title}</h3>
                    <span className={`course-badge-pill ${course.badge_class}`}>
                      {course.badge}
                    </span>
                  </div>
                  <div className="course-byline">{course.subtitle}</div>
                  <div className="course-features-tags">
                    {course.features.map((f) => (
                      <span key={f} className="course-feature-pill">
                        ✓ {f}
                      </span>
                    ))}
                    <span className="course-feature-pill">
                      🗣 {course.language}
                    </span>
                  </div>
                </div>
                <div className="course-footer-row">
                  <div className="course-rating-block">
                    <span className="course-rating-star">★</span>
                    <span>{course.rating}</span>
                    <span className="course-enrolled-count">
                      ({course.enrolled} students)
                    </span>
                  </div>
                  <div className="course-action-buttons">
                    <button type="button" className="btn-view-details">
                      View Details
                    </button>
                    <button type="button" className="btn-start-course">
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Test Series ──────────────────────────────────────────────
function TestSeriesTab({ currentExam }) {
  return (
    <div>
      <div className="section-top-bar">
        <h2 className="section-main-heading">
          {currentExam.code} Official Pattern Full Mock Tests
        </h2>
        <div
          className="nav-pass-active"
          style={{ padding: "6px 12px", borderRadius: 8, fontSize: "0.85rem" }}
        >
          Free Unlimited Attempts
        </div>
      </div>
      <div className="test-series-grid">
        {mockTests.map((test) => (
          <div key={test.id} className="test-mock-card">
            <div>
              <div className="test-card-top">
                {test.free ? (
                  <span className="test-free-tag">Free Mock</span>
                ) : (
                  <span className="test-pro-tag">Pass Unlocked</span>
                )}
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Negative Marking: -{test.negative}
                </span>
              </div>
              <h3 className="test-title">{test.title}</h3>
              <div className="test-meta-pills">
                <span>📝 {test.questions} Questions</span>
                <span>⏱️ {test.duration}</span>
                <span>🎯 {test.marks}</span>
              </div>
            </div>
            <button type="button" className="btn-start-mock">
              Start Mock Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Free Resources ───────────────────────────────────────────
function FreeResourcesTab() {
  const resources = [
    {
      title:
        "Options Greeks & Volatility Mathematical Formula Cheat Sheet (2025)",
      desc: "Complete formula derivations for Delta, Gamma, Theta, Vega, and Rho.",
      tag: "PDF Document",
    },
    {
      title: "SEBI & Exchange Regulatory Acts Quick Revision Handout",
      desc: "Summary of SCRA 1956, SEBI Act 1992, and Takeover Regulations.",
      tag: "PDF Document",
    },
    {
      title: "NSE Exam Test Center Navigation Guide & Keypad Rules",
      desc: "Familiarize with the real computer interface used at NSE IT test centers.",
      tag: "Simulator Demo",
    },
  ];
  return (
    <div>
      <div className="section-top-bar">
        <h2 className="section-main-heading">
          Free Downloads & Formula Sheets
        </h2>
      </div>
      <div className="test-series-grid">
        {resources.map((r, i) => (
          <div key={i} className="test-mock-card">
            <div>
              <span className="test-free-tag">{r.tag}</span>
              <h3 className="test-title" style={{ marginTop: 10 }}>
                {r.title}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#64748b",
                  marginBottom: 14,
                }}
              >
                {r.desc}
              </p>
            </div>
            <button
              type="button"
              className="btn-start-mock"
              style={{ background: "#10b981" }}
            >
              Download Free PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Study Notes ──────────────────────────────────────────────
function StudyNotesTab() {
  const chapters = [
    {
      title: "Chapter 1: Basics of Derivatives & Market Microstructure",
      desc: "Forward contracts, Futures, Margin mechanism, and Mark to Market.",
    },
    {
      title: "Chapter 2: Understanding Options Payoffs & Black-Scholes",
      desc: "Call/Put parity, intrinsic value vs time value, and Greek sensitivities.",
    },
    {
      title: "Chapter 3: Regulatory Framework — SEBI, NSE & NISM Rules",
      desc: "SCRA 1956, SEBI Act 1992, exchange regulations and compliance.",
    },
  ];
  return (
    <div>
      <div className="section-top-bar">
        <h2 className="section-main-heading">
          Chapter-wise Study Notes & Summaries
        </h2>
      </div>
      <div className="test-series-grid">
        {chapters.map((c, i) => (
          <div key={i} className="test-mock-card">
            <h3 className="test-title">{c.title}</h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#64748b",
                marginBottom: 14,
              }}
            >
              {c.desc}
            </p>
            <button type="button" className="btn-start-mock">
              Read Notes Online
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Dashboard Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const [currentExam, setCurrentExam] = useState(availableExams[0]);
  const [activeTab, setActiveTab] = useState("courses");

  const tabContent = {
    courses: <CoursesTab />,
    "test-series": <TestSeriesTab currentExam={currentExam} />,
    "free-resources": <FreeResourcesTab />,
    "study-notes": <StudyNotesTab />,
  };

  return (
    <div className="supercoaching-page">
      <DashboardNavbar
        currentExam={currentExam}
        onExamChange={setCurrentExam}
        onTabChange={setActiveTab}
      />
      <DashboardHero currentExam={currentExam} onTabChange={setActiveTab} />
      <SubNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="super-main-content">
        {tabContent[activeTab] || tabContent["courses"]}
      </main>
    </div>
  );
}
