import React, { useState } from 'react';
import { Mail, Lock, UserPlus, LogIn, KeyRound, ArrowLeft } from 'lucide-react';
import { auth } from '../db/firebase-config';
import defaultLogo from '../assets/logo.png';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

const Auth = ({ onAuthenticated, profileImage }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const getErrorMessage = (errCode) => {
    switch (errCode) {
      case 'auth/invalid-email': return 'Invalid email address format.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Invalid email or password.';
      case 'auth/email-already-in-use': return 'This email is already registered.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      default: return 'An unexpected authentication error occurred.';
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) return setError('Please enter your email address.');

    setLoading(true);

    try {
      if (mode === 'login') {
        if (!password) {
          setError('Please enter your password.');
          setLoading(false);
          return;
        }
        const cred = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if email is verified
        if (!cred.user.emailVerified) {
          setError('Please verify your email address. Check your inbox or spam folder.');
          await signOut(auth);
          setLoading(false);
          return;
        }
        
        onAuthenticated(cred.user.email);
        
      } else if (mode === 'register') {
        if (!password) {
           setError('Please enter a password.');
           setLoading(false);
           return;
        }
        if (password !== confirmPassword) {
           setError('Passwords do not match.');
           setLoading(false);
           return;
        }
        if (!agreedToTerms) {
           setError('You must agree to the Terms and Conditions.');
           setLoading(false);
           return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await signOut(auth); // Log them out so they must verify
        
        setMessage('Registration successful! Please check your email and click the link to verify your account.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setError(getErrorMessage(err.code));
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      minHeight: '100vh', width: '100%', backgroundColor: '#f3f4f6', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '16px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '144px', height: '144px', borderRadius: '50%', background: '#eff6ff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 15px auto', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <img
              src={profileImage || defaultLogo}
              alt="Agency logo"
              style={{ width: '90%', height: '90%', objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.src = defaultLogo; }}
            />
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#111827', fontWeight: '600', letterSpacing: '-0.025em' }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            {mode === 'login' ? 'Enter your credentials to access your account' : 
             mode === 'register' ? 'Sign up to get started' : 
             'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', borderLeft: '4px solid #ef4444' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ background: '#f0fdf4', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', borderLeft: '4px solid #22c55e' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                style={{
                  width: '100%', padding: '12px 12px 12px 40px', boxSizing: 'border-box',
                  border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none',
                  transition: 'all 0.2s', backgroundColor: '#f9fafb', color: '#111827'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)' }}
                onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                <span>Password</span>
                {mode === 'login' && (
                  <span 
                    onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                    style={{ color: '#3b82f6', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 12px 12px 40px', boxSizing: 'border-box',
                    border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none',
                    transition: 'all 0.2s', backgroundColor: '#f9fafb', color: '#111827'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 12px 12px 40px', boxSizing: 'border-box',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none',
                      transition: 'all 0.2s', backgroundColor: '#f9fafb', color: '#111827'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)' }}
                    onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <label htmlFor="terms" style={{ fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
                  I agree to the <span onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#3b82f6', textDecoration: 'underline' }}>Terms and Conditions</span>
                </label>
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#93c5fd' : '#2563eb', 
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1)'
            }}
          >
            {loading && <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            
            {!loading && (
              <>
                {mode === 'login' ? <LogIn size={18} /> : mode === 'register' ? <UserPlus size={18} /> : <KeyRound size={18} />}
                <span>
                  {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
                </span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          {mode === 'login' && (
            <p>
              Don't have an account?{' '}
              <span onClick={() => { setMode('register'); setError(''); setMessage(''); }} style={{ color: '#2563eb', fontWeight: '500', cursor: 'pointer' }}>
                Sign Up
              </span>
            </p>
          )}
          {mode === 'register' && (
            <p>
              Already have an account?{' '}
              <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: '#2563eb', fontWeight: '500', cursor: 'pointer' }}>
                Sign In
              </span>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              <span onClick={() => { setMode('login'); setError(''); setMessage(''); }} style={{ color: '#2563eb', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <ArrowLeft size={16} /> Back to Sign In
              </span>
            </p>
          )}
        </div>

      </div>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowTermsModal(false)}>
          <div style={{ background: 'white', borderRadius: '12px', maxWidth: '500px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: '600' }}>Terms & Conditions</h3>
              <button onClick={() => setShowTermsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer', padding: 0 }}>&times;</button>
            </div>
            <div style={{ padding: '24px', color: '#4b5563', fontSize: '14px', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 12px 0' }}><strong>1. User Agreement:</strong> By using this POS system, you agree to operate it within your licensed business environment and in compliance with applicable laws and regulations.</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>2. Data Ownership:</strong> Your business data remains your property. We process and store it securely as per configured Firebase project settings.</p>
              <p style={{ margin: '0 0 12px 0' }}><strong>3. Privacy:</strong> Do not share account credentials. You are responsible for all actions performed under your account.</p>
              <p style={{ margin: 0 }}><strong>4. Updates:</strong> We may update the system features and policy terms from time to time; continued use indicates acceptance.</p>
            </div>
            <div style={{ padding: '16px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button onClick={() => setShowTermsModal(false)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>I Understand</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
