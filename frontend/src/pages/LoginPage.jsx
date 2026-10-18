import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get('tab') === 'register';
  const { isSignedIn, isLoaded } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      className="auth-page"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at top, #111827 0%, #030712 100%)',
      }}
    >
      {/* Brand Logo Header */}
      <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            textDecoration: 'none',
            color: '#f8fafc',
            fontSize: '1.4rem',
            fontWeight: 800,
          }}
        >
          <div
            className="brand-logo"
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
          </div>
          <span>EasyExam</span>
        </Link>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {isRegister ? 'Start your Fintech & Trading certification journey' : 'Sign in to access mock tests and past year papers'}
        </p>
      </div>

      {/* Clerk Auth Card */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '480px' }}>
        {isRegister ? (
          <SignUp routing="hash" signInUrl="/login" forceRedirectUrl="/dashboard" />
        ) : (
          <SignIn routing="hash" signUpUrl="/login?tab=register" forceRedirectUrl="/dashboard" />
        )}
      </div>

      {/* Footer info */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        <p>Supported Certifications: NISM Series VIII, NCFM Algo Trading, Quant Risk &amp; VaR, NISM Series XV</p>
      </div>
    </div>
  );
}
