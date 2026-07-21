import React, { useState } from 'react';
import { Check, Shield, MapPin, Loader, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DottedSurface } from '../components/ui/dotted-surface';
import * as API from '../services/api';

function calculateAgeFromDob(dob: string) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function Landing({ onLogin, onSignupWithOTP }: { onLogin: (user: any, token: string) => void; onSignupWithOTP?: () => void }) {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupGender, setSignupGender] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const signupAge = calculateAgeFromDob(signupDob);
  const authMode: 'login' | 'signup' = mode === 'signup' ? 'signup' : 'login';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!loginUsername || !loginPassword) {
        setError('Please enter username and password');
        setLoading(false);
        return;
      }

      const response = await API.login(loginUsername, loginPassword);
      sessionStorage.setItem('displayName', response.user.display_name || loginUsername);
      onLogin(response.user, response.session_token);
      setMode('landing');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!signupUsername || !signupEmail || !signupDob || !signupGender || !signupPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!signupGender.trim()) {
      setError('Please select your gender');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    const dobDate = new Date(signupDob);
    if (Number.isNaN(dobDate.getTime())) {
      setError('Please enter a valid date of birth');
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDelta = today.getMonth() - dobDate.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dobDate.getDate())) {
      age--;
    }

    if (age < 18) {
      setError('You must be at least 18 years old to join Wantuu');
      return;
    }

    // Store signup data in sessionStorage
    sessionStorage.setItem('pendingSignup', JSON.stringify({
      username: signupUsername,
      email: signupEmail,
      password: signupPassword,
      dateOfBirth: signupDob,
      gender: signupGender
    }));
    
    // Navigate to OTP signup page
    onSignupWithOTP?.();
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: '#fff',
      overflowX: 'hidden',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <DottedSurface />
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Navigation */}
        <nav className="landing-nav" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'clamp(12px, 4vw, 24px) clamp(12px, 6vw, 24px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,11,15,0.94)',
          backdropFilter: 'blur(18px)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          <div style={{
            fontSize: 'clamp(16px, 5vw, 20px)',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Wantuu
          </div>
        </nav>

        {/* Content */}
        <div className="landing-content" style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(20px, 4vw, 40px) clamp(12px, 5vw, 24px) clamp(28px, 6vw, 44px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="landing-spotlight landing-spotlight-top" style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 107, 0.1), transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div className="landing-spotlight landing-spotlight-bottom" style={{
            position: 'absolute',
            bottom: '-120px',
            left: '-120px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08), transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div className="landing-shell" style={{
            width: '100%',
            maxWidth: '980px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 420px)',
            gap: 'clamp(20px, 4vw, 44px)',
            alignItems: 'center'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="landing-hero"
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                textAlign: 'left'
              }}
            >
              <div className="landing-hero-emoji" style={{ fontSize: '60px', marginBottom: '14px' }}>✨</div>
              <h1 style={{
                fontSize: 'clamp(32px, 6vw, 58px)',
                fontWeight: '700',
                marginBottom: '14px',
                lineHeight: '1.05',
                background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Good People.<br />Good Times.
              </h1>
              <p style={{
                fontSize: 'clamp(14px, 2vw, 17px)',
                color: 'rgba(255,255,255,0.58)',
                marginBottom: '28px',
                maxWidth: '520px',
                lineHeight: '1.8'
              }}>
                Wantuu connects you with real people for real outings. No dating pressure. No financial surprises.
              </p>

              <div className="landing-badges" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(8px, 2vw, 10px)',
                width: '100%',
                maxWidth: '420px'
              }}>
                {[
                  { icon: Check, text: 'All payments at the venue — never in advance' },
                  { icon: Shield, text: 'Every user has a public Reliability Score' },
                  { icon: MapPin, text: 'GPS check-in keeps both parties safe' }
                ].map((badge, i) => {
                  const IconComponent = badge.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="landing-badge"
                      style={{
                        display: 'flex',
                        gap: 'clamp(8px, 3vw, 12px)',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: 'clamp(8px, 2vw, 12px) clamp(10px, 3vw, 16px)',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'clamp(28px, 8vw, 36px)',
                        height: 'clamp(28px, 8vw, 36px)',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                        flexShrink: 0
                      }}>
                        <IconComponent size={16} color="#fff" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: 'rgba(255,255,255,0.6)' }}>{badge.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="landing-auth"
              style={{
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: 'clamp(20px, 6vw, 32px) clamp(16px, 5vw, 28px)',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                justifySelf: 'center'
              }}
            >
              <div className="landing-toggle-row" style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '14px',
                padding: '4px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px'
              }}>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '11px',
                    border: 'none',
                    background: mode === 'login' ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' : 'transparent',
                    color: mode === 'login' ? '#111318' : 'rgba(255,255,255,0.7)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '11px',
                    border: 'none',
                    background: mode === 'signup' ? 'linear-gradient(135deg, #FCD34D, #F59E0B)' : 'transparent',
                    color: mode === 'signup' ? '#111318' : 'rgba(255,255,255,0.7)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Create Account
                </button>
              </div>

              <h2 style={{
                fontSize: 'clamp(18px, 6vw, 24px)',
                fontWeight: '700',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.8))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p style={{
                fontSize: 'clamp(12px, 3vw, 13px)',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '24px'
              }}>
                {authMode === 'login'
                  ? 'Log in with your username and password'
                  : 'Sign up to start meeting good people'}
              </p>

              <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 14px)' }}>
                {error && (
                  <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    color: '#FF6B6B',
                    padding: 'clamp(8px, 2vw, 12px)',
                    borderRadius: '8px',
                    fontSize: 'clamp(11px, 3vw, 13px)',
                    textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}

                {/* Email (Signup only) */}
                {authMode === 'signup' && (
                  <div>
                    <label style={{
                      fontSize: 'clamp(10px, 2vw, 11px)',
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: '6px',
                      display: 'block',
                      fontWeight: '600'
                    }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{
                        width: '100%',
                        padding: 'clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        fontSize: 'clamp(13px, 3vw, 14px)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#F59E0B';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    />
                  </div>
                )}

                {/* Date of Birth (Signup only) */}
                {authMode === 'signup' && (
                  <div>
                    <label style={{
                      fontSize: 'clamp(10px, 2vw, 11px)',
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: '6px',
                      display: 'block',
                      fontWeight: '600'
                    }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={signupDob}
                      onChange={(e) => setSignupDob(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        fontSize: 'clamp(13px, 3vw, 14px)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#F59E0B';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    />
                    <p style={{
                      marginTop: '6px',
                      fontSize: 'clamp(10px, 2.5vw, 12px)',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      {signupAge !== null ? `You are ${signupAge} years old.` : 'Used to calculate your age and improve trust & safety.'}
                    </p>
                  </div>
                )}

                {/* Gender (Signup only) */}
                {authMode === 'signup' && (
                  <div>
                    <label style={{
                      fontSize: 'clamp(10px, 2vw, 11px)',
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: '6px',
                      display: 'block',
                      fontWeight: '600'
                    }}>
                      Gender
                    </label>
                    <select
                      value={signupGender}
                      onChange={(e) => setSignupGender(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        fontSize: 'clamp(13px, 3vw, 14px)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLSelectElement).style.borderColor = '#F59E0B';
                        (e.target as HTMLSelectElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLSelectElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.target as HTMLSelectElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <option value="">Select gender</option>
                      <option value="Woman">Woman</option>
                      <option value="Man">Man</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                )}

                {/* Username */}
                <div>
                  <label style={{
                    fontSize: 'clamp(10px, 2vw, 11px)',
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '600'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={authMode === 'login' ? loginUsername : signupUsername}
                    onChange={(e) => {
                      if (authMode === 'login') setLoginUsername(e.target.value);
                      else setSignupUsername(e.target.value);
                    }}
                    placeholder="johndoe"
                    style={{
                      width: '100%',
                      padding: 'clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.02)',
                      color: '#fff',
                      fontSize: 'clamp(13px, 3vw, 14px)',
                      transition: 'all 0.2s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = '#F59E0B';
                      (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
                      (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.02)';
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label style={{
                    fontSize: 'clamp(10px, 2vw, 11px)',
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '6px',
                    display: 'block',
                    fontWeight: '600'
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authMode === 'login' ? loginPassword : signupPassword}
                      onChange={(e) => {
                        if (authMode === 'login') setLoginPassword(e.target.value);
                        else setSignupPassword(e.target.value);
                      }}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: 'clamp(10px, 2vw, 12px) clamp(30px, 8vw, 40px) clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        fontSize: 'clamp(13px, 3vw, 14px)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#F59E0B';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password (Signup only) */}
                {authMode === 'signup' && (
                  <div>
                    <label style={{
                      fontSize: 'clamp(10px, 2vw, 11px)',
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: '6px',
                      display: 'block',
                      fontWeight: '600'
                    }}>
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: 'clamp(10px, 2vw, 12px) clamp(10px, 2vw, 14px)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)',
                        color: '#fff',
                        fontSize: 'clamp(13px, 3vw, 14px)',
                        transition: 'all 0.2s',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = '#F59E0B';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                      onBlur={(e) => {
                        (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: 'clamp(11px, 3vw, 13px) clamp(15px, 4vw, 20px)',
                    borderRadius: '10px',
                    border: 'none',
                    background: loading ? 'rgba(245, 158, 11, 0.5)' : 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: 'clamp(13px, 3vw, 15px)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(252,211,77,0.4)';
                      (e.target as HTMLButtonElement).style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      (e.target as HTMLButtonElement).style.boxShadow = 'none';
                      (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                    }
                  }}
                >
                  {loading && <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />}
                  {loading ? 'Processing...' : (authMode === 'login' ? 'Log In' : 'Create Account')}
                </button>

                {authMode === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <Link
                      to="/forgot-password"
                      style={{
                        color: '#F59E0B',
                        fontWeight: 700,
                        fontSize: '13px',
                        textDecoration: 'none'
                      }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                {/* Toggle Auth Mode */}
                <p style={{
                  fontSize: 'clamp(12px, 3vw, 13px)',
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center',
                  marginTop: '12px'
                }}>
                  {authMode === 'login'
                    ? "Don't have an account? " 
                    : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(authMode === 'login' ? 'signup' : 'login');
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F59E0B',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
