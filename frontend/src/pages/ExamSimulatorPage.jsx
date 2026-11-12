import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import "../simulator.css";

export default function ExamSimulatorPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Loading & Test Session States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User Response State: { [qId]: { selectedChoiceId, isFlagged, visited } }
  const [answers, setAnswers] = useState({});

  // Timer & Modal States
  const [timeRemaining, setTimeRemaining] = useState(120 * 60);
  const [totalSeconds, setTotalSeconds] = useState(120 * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Filter for review mode
  const [reviewFilter, setReviewFilter] = useState("all");

  const timerRef = useRef(null);

  // ── 1. Initialize Test Session ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function startTest() {
      try {
        setLoading(true);
        setError(null);

        let headers = { "Content-Type": "application/json" };
        try {
          const token = await getToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        } catch {
          // Anonymous practice mode fallback
        }

        const res = await fetch(`/api/tests/${testId || 1}/start/`, {
          method: "POST",
          headers,
        });

        if (!res.ok) {
          throw new Error(`Failed to load test (HTTP ${res.status})`);
        }

        const data = await res.json();
        if (!isMounted) return;

        setAttemptId(data.attempt_id);
        setTestData(data.test);
        setQuestions(data.test.questions || []);

        const durationSec = (data.test.duration_minutes || 120) * 60;
        setTotalSeconds(durationSec);
        setTimeRemaining(durationSec);

        // Prepopulate answers map
        const initialAnswers = {};
        (data.test.questions || []).forEach((q, idx) => {
          initialAnswers[q.id] = {
            selectedChoiceId: null,
            isFlagged: false,
            visited: idx === 0, // Mark question 1 visited initially
          };
        });
        setAnswers(initialAnswers);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    startTest();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [testId, getToken]);

  // ── 2. Live Countdown Timer ────────────────────────────────────
  useEffect(() => {
    if (loading || resultData || error) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, resultData, error]);

  const handleAutoSubmit = () => {
    submitExam(true);
  };

  // ── 3. Question Navigation & Answer Handlers ───────────────────
  const currentQ = questions[currentIdx];
  const currentAns = currentQ ? (answers[currentQ.id] || { selectedChoiceId: null, isFlagged: false }) : null;

  const markVisited = (idx) => {
    const q = questions[idx];
    if (!q) return;
    setAnswers((prev) => ({
      ...prev,
      [q.id]: {
        ...(prev[q.id] || { selectedChoiceId: null, isFlagged: false }),
        visited: true,
      },
    }));
  };

  const handleSelectChoice = (choiceId) => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {}),
        selectedChoiceId: choiceId,
        visited: true,
      },
    }));
  };

  const handleClearChoice = () => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {}),
        selectedChoiceId: null,
      },
    }));
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...(prev[currentQ.id] || {}),
        isFlagged: !prev[currentQ.id]?.isFlagged,
        visited: true,
      },
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      markVisited(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      markVisited(prevIdx);
    }
  };

  const handleJump = (idx) => {
    setCurrentIdx(idx);
    markVisited(idx);
    setPaletteOpen(false);
  };

  // ── 4. Submit Assessment ───────────────────────────────────────
  const submitExam = async (isAuto = false) => {
    if (!attemptId || submitting) return;

    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      let headers = { "Content-Type": "application/json" };
      try {
        const token = await getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch {
        // Continue anonymous
      }

      const timeSpent = Math.max(0, totalSeconds - timeRemaining);
      const payloadAnswers = Object.entries(answers).map(([qId, ans]) => ({
        question_id: parseInt(qId),
        selected_choice_id: ans.selectedChoiceId,
        is_flagged: ans.isFlagged,
      }));

      const res = await fetch(`/api/attempts/${attemptId}/submit/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          time_spent_seconds: timeSpent,
          answers: payloadAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to grade exam (HTTP ${res.status})`);
      }

      const result = await res.json();
      setResultData(result);
      setShowSubmitModal(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert("Error submitting exam: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: Format Seconds -> HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Compute stats for palette & submit modal
  const answeredCount = Object.values(answers).filter((a) => a.selectedChoiceId !== null).length;
  const flaggedCount = Object.values(answers).filter((a) => a.isFlagged).length;
  const unvisitedCount = questions.filter((q) => !answers[q.id]?.visited).length;

  // ── Render Loading / Error States ──────────────────────────────
  if (loading) {
    return (
      <div className="sim-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏱️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Initializing Official Exam Simulator...</h2>
          <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Configuring timer, question palette & SPAN margin rules</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sim-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "450px", padding: "2rem" }}>
          <div style={{ fontSize: "2rem", color: "#ef4444", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Unable to Start Test</h2>
          <p style={{ color: "#64748b", margin: "0.75rem 0 1.5rem" }}>{error}</p>
          <button onClick={() => navigate("/dashboard")} className="sim-btn-action sim-btn-save-next">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Render Scorecard & Diagnostics Screen ──────────────────────
  if (resultData) {
    const isPassed = resultData.passed;
    const filteredQuestions = (resultData.questions_review || []).filter((q) => {
      if (reviewFilter === "correct") return q.is_correct;
      if (reviewFilter === "incorrect") return q.selected_choice_id !== null && !q.is_correct;
      if (reviewFilter === "unattempted") return q.selected_choice_id === null;
      if (reviewFilter === "flagged") return q.is_flagged;
      return true;
    });

    return (
      <div className="sim-container">
        {/* Header */}
        <header className="sim-header">
          <div className="sim-header-left">
            <span className="sim-badge-code">{resultData.certification_code}</span>
            <h1 className="sim-exam-title">{resultData.test_title} — Official Scorecard</h1>
          </div>
          <div className="sim-header-right">
            <Link to="/dashboard" className="sim-btn-action sim-btn-nav">
              Back to Dashboard
            </Link>
          </div>
        </header>

        {/* Results Container */}
        <div className="res-container">
          {/* Banner */}
          <div className={`res-banner ${isPassed ? "passed" : "failed"}`}>
            <div className="res-banner-header">
              <div>
                <h2 className="res-status-title">
                  {isPassed ? "🎉 Congratulations! You Passed" : "Needs Improvement — Keep Practicing"}
                </h2>
                <p className="res-status-sub">
                  Official Passing Threshold: {resultData.passing_score}% | Negative Marking: -0.25 per error
                </p>
              </div>
            </div>

            <div className="res-metrics-grid">
              <div className="res-metric-card">
                <div className="res-metric-val">{resultData.score} / {resultData.total_questions}</div>
                <div className="res-metric-lbl">Total Marks</div>
              </div>
              <div className="res-metric-card">
                <div className="res-metric-val">{resultData.percentage}%</div>
                <div className="res-metric-lbl">Overall Percentage</div>
              </div>
              <div className="res-metric-card">
                <div className="res-metric-val">{resultData.correct_count}</div>
                <div className="res-metric-lbl">Correct Answers</div>
              </div>
              <div className="res-metric-card">
                <div className="res-metric-val">{resultData.incorrect_count}</div>
                <div className="res-metric-lbl">Incorrect (-0.25)</div>
              </div>
              <div className="res-metric-card">
                <div className="res-metric-val">{formatTime(resultData.time_spent_seconds)}</div>
                <div className="res-metric-lbl">Time Spent</div>
              </div>
            </div>
          </div>

          {/* Topic-Wise Diagnostics */}
          {resultData.topic_diagnostics && resultData.topic_diagnostics.length > 0 && (
            <div style={{ marginBottom: "2.5rem" }}>
              <h3 className="res-section-title">📊 Topic-by-Topic Performance Diagnostics</h3>
              <div className="res-topics-grid">
                {resultData.topic_diagnostics.map((topic, i) => {
                  const pct = topic.total > 0 ? Math.max(0, Math.round((topic.correct / topic.total) * 100)) : 0;
                  return (
                    <div key={i} className="res-topic-card">
                      <div className="res-topic-header">
                        <span>{topic.topic}</span>
                        <span style={{ color: pct >= 60 ? "#15803d" : "#b91c1c" }}>
                          {topic.correct}/{topic.total} ({pct}%)
                        </span>
                      </div>
                      <div className="res-progress-bar">
                        <div
                          className="res-progress-fill"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 60 ? "#10b981" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Review Section */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 className="res-section-title" style={{ margin: 0 }}>
                🔍 Detailed Answer Key & Formula Explanations
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="res-filter-bar">
              <button
                className={`res-filter-btn ${reviewFilter === "all" ? "active" : ""}`}
                onClick={() => setReviewFilter("all")}
              >
                All ({resultData.questions_review?.length || 0})
              </button>
              <button
                className={`res-filter-btn ${reviewFilter === "correct" ? "active" : ""}`}
                onClick={() => setReviewFilter("correct")}
              >
                Correct ({resultData.correct_count})
              </button>
              <button
                className={`res-filter-btn ${reviewFilter === "incorrect" ? "active" : ""}`}
                onClick={() => setReviewFilter("incorrect")}
              >
                Incorrect ({resultData.incorrect_count})
              </button>
              <button
                className={`res-filter-btn ${reviewFilter === "unattempted" ? "active" : ""}`}
                onClick={() => setReviewFilter("unattempted")}
              >
                Unattempted ({resultData.unattempted_count})
              </button>
            </div>

            {/* Questions List */}
            {filteredQuestions.map((q) => {
              const status = q.selected_choice_id === null
                ? "unattempted"
                : q.is_correct
                ? "correct"
                : "incorrect";

              return (
                <div key={q.id} className="res-review-card">
                  <div className="res-review-header">
                    <span className="sim-question-tag">{q.topic_name}</span>
                    <span className={`res-status-badge ${status}`}>
                      {status === "correct" && "✓ Correct (+1.00)"}
                      {status === "incorrect" && "✗ Incorrect (-0.25)"}
                      {status === "unattempted" && "— Unattempted (0.00)"}
                    </span>
                  </div>

                  <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem", color: "#0f172a" }}>
                    Q{q.order}. {q.question_text}
                  </h4>

                  <div className="sim-choices-list" style={{ marginBottom: "1rem" }}>
                    {q.choices.map((c, cIdx) => {
                      const letters = ["A", "B", "C", "D"];
                      const isUserSelected = q.selected_choice_id === c.id;
                      const isCorrectChoice = c.is_correct;

                      let borderColor = "#e2e8f0";
                      let bgColor = "#ffffff";
                      if (isCorrectChoice) {
                        borderColor = "#10b981";
                        bgColor = "#f0fdf4";
                      } else if (isUserSelected && !isCorrectChoice) {
                        borderColor = "#ef4444";
                        bgColor = "#fef2f2";
                      }

                      return (
                        <div
                          key={c.id}
                          className="sim-choice-item"
                          style={{
                            borderColor,
                            backgroundColor: bgColor,
                            cursor: "default",
                          }}
                        >
                          <div
                            className="sim-choice-letter"
                            style={{
                              background: isCorrectChoice ? "#10b981" : isUserSelected ? "#ef4444" : "#e2e8f0",
                              color: (isCorrectChoice || isUserSelected) ? "#ffffff" : "#334155",
                            }}
                          >
                            {letters[cIdx] || letters[c.order - 1]}
                          </div>
                          <div className="sim-choice-text" style={{ flex: 1 }}>
                            {c.choice_text}
                            {isCorrectChoice && (
                              <span style={{ marginLeft: "0.5rem", fontWeight: 700, color: "#15803d" }}>
                                (Official Answer)
                              </span>
                            )}
                            {isUserSelected && !isCorrectChoice && (
                              <span style={{ marginLeft: "0.5rem", fontWeight: 700, color: "#b91c1c" }}>
                                (Your Selection)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Official Explanation */}
                  {q.explanation && (
                    <div className="res-explanation-box">
                      <strong>💡 Concept & Formula Explanation:</strong>
                      <p style={{ margin: "0.25rem 0 0" }}>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="res-footer-nav">
            <button onClick={() => window.location.reload()} className="sim-btn-action sim-btn-nav">
              Retake Mock Test
            </button>
            <Link to="/dashboard" className="sim-btn-action sim-btn-save-next">
              Go to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Active Exam Simulator ───────────────────────────────
  const letters = ["A", "B", "C", "D"];
  const isTimeCritical = timeRemaining < 120; // < 2 mins
  const isTimeWarning = timeRemaining < 600; // < 10 mins

  return (
    <div className="sim-container">
      {/* ── Fixed Exam Header ───────────────────────────────────── */}
      <header className="sim-header">
        <div className="sim-header-left">
          <span className="sim-badge-code">{testData?.certification_code || "NISM"}</span>
          <h1 className="sim-exam-title">{testData?.title || "Official Mock Exam"}</h1>
        </div>

        <div className="sim-header-center">
          <div className={`sim-timer-pill ${isTimeCritical ? "danger" : isTimeWarning ? "warning" : ""}`}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="sim-header-right">
          {/* Mobile/Tablet Palette Toggle Button */}
          <button
            type="button"
            className="sim-btn-palette-toggle"
            onClick={() => setPaletteOpen(!paletteOpen)}
            aria-label="Toggle Question Palette"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="sim-toggle-text">
              Palette <span className="sim-palette-count-chip">{answeredCount}/{questions.length}</span>
            </span>
          </button>

          <button onClick={() => setShowSubmitModal(true)} className="sim-btn-submit-header">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="sim-submit-btn-lbl">Submit</span>
          </button>
        </div>
      </header>

      {/* ── Main Simulator Body (Two-Pane Layout) ─────────────────── */}
      <div className="sim-body">
        {/* Mobile Backdrop for Palette Drawer */}
        {paletteOpen && (
          <div
            className="sim-palette-backdrop"
            onClick={() => setPaletteOpen(false)}
          />
        )}

        {/* Left: Question Card & Response Controls */}
        <main className="sim-content-pane">
          {currentQ ? (
            <>
              <div className="sim-question-meta">
                <span className="sim-question-tag">{currentQ.topic_name || "General"}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span className="sim-marks-pill">+{currentQ.marks} Marks</span>
                  <span className="sim-marks-pill" style={{ color: "#b91c1c" }}>-{currentQ.negative_marks} Negative</span>
                </div>
              </div>

              <div className="sim-question-number">
                Question {currentIdx + 1} of {questions.length}
              </div>

              <div className="sim-question-text">{currentQ.question_text}</div>

              {/* Choices */}
              <div className="sim-choices-list">
                {currentQ.choices?.map((choice, cIdx) => {
                  const isSelected = currentAns?.selectedChoiceId === choice.id;
                  return (
                    <div
                      key={choice.id}
                      className={`sim-choice-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectChoice(choice.id)}
                    >
                      <div className="sim-choice-letter">{letters[cIdx] || letters[choice.order - 1]}</div>
                      <div className="sim-choice-text">{choice.choice_text}</div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Action Bar */}
              <div className="sim-actions-bar">
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handleToggleFlag}
                    className={`sim-btn-action sim-btn-flag ${currentAns?.isFlagged ? "active" : ""}`}
                  >
                    {currentAns?.isFlagged ? "★ Flagged for Review" : "☆ Mark for Review"}
                  </button>
                  {currentAns?.selectedChoiceId && (
                    <button onClick={handleClearChoice} className="sim-btn-action sim-btn-clear">
                      Clear Response
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="sim-btn-action sim-btn-nav"
                    style={{ opacity: currentIdx === 0 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="sim-btn-action sim-btn-save-next"
                  >
                    {currentIdx === questions.length - 1 ? "Review All" : "Save & Next →"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>No question available.</div>
          )}
        </main>

        {/* Right: Question Navigation Palette */}
        <aside className={`sim-palette-pane ${paletteOpen ? "open" : ""}`}>
          <div className="sim-palette-header-row">
            <div className="sim-palette-title">Question Palette</div>
            <button
              type="button"
              className="sim-palette-close-btn"
              onClick={() => setPaletteOpen(false)}
              aria-label="Close question palette"
            >
              ✕
            </button>
          </div>

          {/* Palette Status Legend */}
          <div className="sim-palette-legend">
            <div className="sim-legend-item">
              <span className="sim-dot answered" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="sim-legend-item">
              <span className="sim-dot flagged" />
              <span>Review ({flaggedCount})</span>
            </div>
            <div className="sim-legend-item">
              <span className="sim-dot unvisited" />
              <span>Unvisited ({unvisitedCount})</span>
            </div>
            <div className="sim-legend-item">
              <span className="sim-dot flagged-ans" />
              <span>Ans + Review</span>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="sim-palette-grid">
            {questions.map((q, idx) => {
              const a = answers[q.id];
              const isCurrent = idx === currentIdx;
              const hasAnswer = a?.selectedChoiceId !== null && a?.selectedChoiceId !== undefined;
              const isFlagged = a?.isFlagged;

              let statusClass = "";
              if (hasAnswer && isFlagged) statusClass = "flagged-answered";
              else if (hasAnswer) statusClass = "answered";
              else if (isFlagged) statusClass = "flagged";

              return (
                <button
                  key={q.id}
                  onClick={() => handleJump(idx)}
                  className={`sim-palette-btn ${isCurrent ? "current" : ""} ${statusClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Real-time Summary Card */}
          <div className="sim-palette-summary">
            <div className="sim-summary-row">
              <span>Total Questions:</span>
              <span>{questions.length}</span>
            </div>
            <div className="sim-summary-row">
              <span>Attempted:</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>{answeredCount}</span>
            </div>
            <div className="sim-summary-row">
              <span>Marked for Review:</span>
              <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{flaggedCount}</span>
            </div>
            <div className="sim-summary-row bold">
              <span>Remaining:</span>
              <span>{questions.length - answeredCount}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="sim-btn-action sim-btn-save-next"
            style={{ marginTop: "1rem", width: "100%", background: "#059669" }}
          >
            Submit Test Paper
          </button>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ─────────────────────────────── */}
      {showSubmitModal && (
        <div className="sim-modal-overlay">
          <div className="sim-modal-card">
            <h3 className="sim-modal-title">Ready to Submit Your Exam?</h3>
            <p className="sim-modal-desc">
              Once submitted, your paper will be graded immediately with official SEBI/NISM -0.25 negative marking rules.
            </p>

            <div className="sim-modal-stats">
              <div className="sim-stat-box">
                <div className="val">{answeredCount}</div>
                <div className="lbl">Answered Questions</div>
              </div>
              <div className="sim-stat-box">
                <div className="val">{questions.length - answeredCount}</div>
                <div className="lbl">Unattempted</div>
              </div>
              <div className="sim-stat-box">
                <div className="val">{flaggedCount}</div>
                <div className="lbl">Marked for Review</div>
              </div>
              <div className="sim-stat-box">
                <div className="val">{formatTime(timeRemaining)}</div>
                <div className="lbl">Time Remaining</div>
              </div>
            </div>

            <div className="sim-modal-actions">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="sim-btn-action sim-btn-nav"
              >
                Resume Exam
              </button>
              <button
                onClick={() => submitExam(false)}
                disabled={submitting}
                className="sim-btn-action sim-btn-save-next"
                style={{ background: "#059669" }}
              >
                {submitting ? "Submitting & Grading..." : "Confirm Final Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

