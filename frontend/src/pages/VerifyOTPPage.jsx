import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function VerifyOTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) { setShowResend(true); return; }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    setError('');
    // Simulate verification
    setTimeout(() => {
      navigate('/dashboard');
      setLoading(false);
    }, 800);
  };

  const handleResend = () => {
    setShowResend(false);
    setSecondsLeft(60);
    setError('');
    // Simulate resend
  };

  return (
    <div className="auth-page">
      <div className="auth-card otp-card">
        <div className="auth-header">
          <div className="brand-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="3"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
          </div>
          <h1 className="auth-title">Check your inbox</h1>
          <p className="auth-subtitle">
            We sent a 6-digit confirmation code to <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div className="form-error-banner" style={{ marginBottom: 20 }}>
            <div className="error-text"><p>{error}</p></div>
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
          noValidate
        >
          <div className="form-group" style={{ width: '100%', textAlign: 'center' }}>
            <input
              type="text"
              id="otpInput"
              className="form-input otp-single-input"
              maxLength={6}
              pattern="[0-9]{6}"
              inputMode="numeric"
              placeholder="••••••"
              autoFocus
              required
              autoComplete="one-time-code"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <span>{loading ? 'Verifying...' : 'Confirm & Create Account'}</span>
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          {!showResend ? (
            <div id="countdownArea">
              Didn't receive code? Resend in{' '}
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{secondsLeft}</span>s
            </div>
          ) : (
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}
                onClick={handleResend}
              >
                Click here to resend code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
