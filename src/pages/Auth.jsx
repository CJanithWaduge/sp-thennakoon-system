import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { auth } from '../db/firebase-config';
import defaultLogo from '../assets/logo.png';
import { 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';

const Auth = ({ onAuthenticated, profileImage }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [processingLink, setProcessingLink] = useState(false);

  // Helper to neatly map Firebase errors to human text
  const getErrorMessage = (errCode) => {
    switch (errCode) {
      case 'auth/invalid-email': return 'Invalid email address format.';
      case 'auth/user-disabled': return 'This account has been disabled.';
      default: return 'An unexpected authentication error occurred.';
    }
  };

  useEffect(() => {
    // Check if user came back from clicking the magic link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        // User opened the link on a different device. Provide prompt.
        emailForSignIn = window.prompt('Please provide your email for confirmation');
      }
      
      if (emailForSignIn) {
        setProcessingLink(true);
        signInWithEmailLink(auth, emailForSignIn, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            console.log('✅ MAGIC LINK LOGIN SUCCESS for:', result.user.email);
            onAuthenticated(result.user.email);
          })
          .catch((err) => {
            console.error('❌ LOGIN FAILED:', err);
            setError('Error signing in with this link. It may have expired or already been used.');
            setProcessingLink(false);
          });
      }
    }
  }, [onAuthenticated]);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address.');
    if (!agreedToTerms) return setError('You must agree to the Terms and Conditions.');
    
    setError('');
    setMessage('');
    setLoading(true);

    const actionCodeSettings = {
      // URL to redirect back to. Resolves localhost during dev, and full domain in prod.
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage('Magic link sent! Please check your email inbox (and spam folder) and click the secure link to log in instantly.');
      setLoading(false);
    } catch (err) {
      console.error('❌ SEND LINK FAILED:', err);
      setError(getErrorMessage(err.code));
      setLoading(false);
    }
  };

  // If the app is currently verifying the link in the background, show a loading screen
  if (processingLink) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', backgroundColor: '#f3f4f6' }}>
        <p style={{ fontSize: '16px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', border: '3px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Verifying your secure magic link...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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
        
        {/* PREMIUM HEADER */}
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
            Passwordless Log In
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
            Enter your email to receive a secure, password-free login link.
          </p>
        </div>

        {/* ALERTS */}
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

        {/* FORM */}
        {/* We only show the form if the message hasn't been sent yet, minimizing clutter once they succeed */}
        {!message && (
          <form onSubmit={handleSendLink}>
            
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
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
            >
              {loading && <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              
              {!loading && 'Send Magic Link'}
            </button>
          </form>
        )}
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
