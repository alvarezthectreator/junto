import React, { useState } from 'react';
import { Check, Shield, MapPin, Loader, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { DottedSurface } from '../components/ui/dotted-surface';
import * as API from '../services/api';

export function Landing({ onLogin }: { onLogin: (user: any, token: string) => void }) {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupReferralCode, setSignupReferralCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('ref') || '';
  });

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
      localStorage.setItem('displayName', response.user.display_name || loginUsername);
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

    if (!signupUsername || !signupFullName || !signupPassword) {
      setError('Please fill in all fields');
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

    setLoading(true);

    try {
      const response = await API.signup(signupUsername, signupFullName, signupPassword, signupReferralCode || undefined);
      localStorage.setItem('displayName', signupFullName);
      onLogin(response.user, response.session_token);
      setMode('landing');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: '#fff',
      overflow: 'hidden',
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
        height: '100vh'
      }}>
        {/* Navigation */}
        <nav style={{
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
            Junto
          </div>
          {mode !== 'landing' && (
            <button
              onClick={() => {
                setMode('landing');
                setError('');
              }}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'transparent',
                color: '#F59E0B',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.opacity = '0.8';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.opacity = '1';
              }}
            >
              Back
            </button>
          )}
        </nav>

        {/* Content */}
        {mode === 'landing' ? (
          // Hero Section
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(20px, 8vw, 60px) clamp(16px, 6vw, 40px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 107, 107, 0.1), transparent 70%)',
              pointerEvents: 'none'
            }} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ position: 'relative', zIndex: 1 }}
            >
              <div style={{ fontSize: '60px', marginBottom: '18px' }}>✨</div>
              <h1 style={{
                fontSize: 'clamp(24px, 10vw, 48px)',
                fontWeight: '700',
                marginBottom: '20px',
                lineHeight: '1.2',
                background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Good People.<br />Good Times.
              </h1>
              <p style={{
                fontSize: 'clamp(13px, 4vw, 16px)',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '36px',
                maxWidth: '380px',
                lineHeight: '1.8',
                margin: '0 auto 36px'
              }}>
                Junto connects you with real people for real outings. No dating pressure. No financial surprises.
              </p>

              {/* Trust badges */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(8px, 3vw, 12px)',
                width: '100%',
                maxWidth: '360px',
                marginBottom: '36px'
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

              <div style={{ display: 'flex', gap: 'clamp(8px, 3vw, 12px)', flexDirection: 'column', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(252,211,77,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('signup')}
                  style={{
                    padding: 'clamp(11px, 3vw, 15px) clamp(20px, 6vw, 40px)',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: 'clamp(13px, 4vw, 16px)',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(252,211,77,0.3)',
                    width: '100%',
                    transition: 'all 0.3s'
                  }}
                >
                  Create Account
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('login')}
                  style={{
                    padding: 'clamp(11px, 3vw, 15px) clamp(20px, 6vw, 40px)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: '#F59E0B',
                    fontWeight: '700',
                    fontSize: 'clamp(13px, 4vw, 16px)',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s'
                  }}
                >
                  Already have an account?
                </motion.button>
              </div>
            </motion.div>
          </div>
        ) : (
          // Auth Forms
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(16px, 6vw, 40px) clamp(12px, 4vw, 20px)'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: 'clamp(20px, 6vw, 32px) clamp(16px, 5vw, 28px)',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
              }}
            >
              <h2 style={{
                fontSize: 'clamp(18px, 6vw, 24px)',
                fontWeight: '700',
                marginBottom: '12px',
                background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.8))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p style={{
                fontSize: 'clamp(12px, 3vw, 13px)',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '24px'
              }}>
                {mode === 'login' 
                  ? 'Log in with your username and password' 
                  : 'Sign up to start meeting good people'}
              </p>

              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 14px)' }}>
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

                {/* Full Name (Signup only) */}
                {mode === 'signup' && (
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
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="John Doe"
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
                    value={mode === 'login' ? loginUsername : signupUsername}
                    onChange={(e) => {
                      if (mode === 'login') setLoginUsername(e.target.value);
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

                {/* Referral Code (Signup only) */}
                {mode === 'signup' && (
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
                      Referral Code
                    </label>
                    <input
                      type="text"
                      value={signupReferralCode}
                      onChange={(e) => setSignupReferralCode(e.target.value.toUpperCase())}
                      placeholder="JNT-2024-12345"
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
                      value={mode === 'login' ? loginPassword : signupPassword}
                      onChange={(e) => {
                        if (mode === 'login') setLoginPassword(e.target.value);
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
                {mode === 'signup' && (
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
                  {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Create Account')}
                </button>

                {/* Toggle Auth Mode */}
                <p style={{
                  fontSize: 'clamp(12px, 3vw, 13px)',
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center',
                  marginTop: '12px'
                }}>
                  {mode === 'login' 
                    ? "Don't have an account? " 
                    : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
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
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </form>
            </motion.div>
          </div>
        )}
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
