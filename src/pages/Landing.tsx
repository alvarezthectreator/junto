import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, Shield, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { DottedSurface } from '../components/ui/dotted-surface';

export function Landing({ onLogin }: { onLogin: (email: string, password: string) => void }) {
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setShowLogin(false);
    onLogin(email, password);
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
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(10,11,15,0.94)',
        backdropFilter: 'blur(18px)',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Junto
        </div>
        <button
          onClick={() => setShowLogin(true)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(252,211,77,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(252,211,77,0.4)';
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.transform = 'scale(1)';
            (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(252,211,77,0.3)';
          }}
        >
          Log in
        </button>
      </nav>

      {/* Hero Section */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 28px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative blob */}
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
            fontSize: 'clamp(28px, 8vw, 42px)',
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
            fontSize: '16px',
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
            gap: '12px',
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
                    gap: '12px',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
                    flexShrink: 0
                  }}>
                    <IconComponent size={20} color="#fff" strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{badge.text}</span>
                </motion.div>
              );
            })}
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(252,211,77,0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowLogin(true)}
            style={{
              padding: '15px 40px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #FCD34D, #F59E0B)',
              color: '#fff',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(252,211,77,0.3)',
              maxWidth: '320px',
              width: '100%',
              transition: 'all 0.3s'
            }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLogin(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 500,
            padding: '20px'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111318',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '26px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                marginBottom: '8px',
                background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.8))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {isSignUp ? 'Sign up to start discovering events' : 'Sign in to your account'}
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Email Input */}
              <div>
                <label style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '5px',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Email Address
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '0 14px',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}>
                  <Mail size={18} color='rgba(255,255,255,0.3)' />
                  <input
                    type='email'
                    placeholder='your@email.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      padding: '13px 0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '5px',
                  display: 'block',
                  fontWeight: '600'
                }}>
                  Password
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '0 14px',
                  gap: '10px',
                  transition: 'all 0.2s'
                }}>
                  <Lock size={18} color='rgba(255,255,255,0.3)' />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#fff',
                      padding: '13px 0',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      transition: 'color 0.2s'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'rgba(255,107,107,0.15)',
                    border: '1px solid rgba(255,107,107,0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#FF8888',
                    fontSize: '13px'
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #F59E0B, #FB923C)',
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: '14px',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '6px',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.3s'
                }}
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </motion.button>

              {/* Toggle Sign Up / Sign In */}
              <p style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.6)',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type='button'
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#A78BFA',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13px',
                    transition: 'color 0.2s'
                  }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </form>

            {/* Demo Credentials */}
            <div style={{
              marginTop: '20px',
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: '12px',
              padding: '14px 16px'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                margin: 0
              }}>
                Demo Credentials
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>📧 demo@junto.app</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>🔑 password123</p>
              </div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)',
                marginTop: '8px',
                margin: '8px 0 0 0'
              }}>
                Or create a new account with any email & password (6+ chars)
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
