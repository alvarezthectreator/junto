import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import * as API from '../services/api';

export function OTPSignup({ onSuccess, onBack }: { 
  onSuccess: (token: string, user: any) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [signupData, setSignupData] = useState<any>(null);

  // Load pending signup data on mount
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingSignup');
    if (pending) {
      const data = JSON.parse(pending);
      setSignupData(data);
      setEmail(data.email);
      setStep('email'); // Show email confirmation step first
    }
  }, []);

  // Timer for OTP countdown
  useEffect(() => {
    if (step === 'verify' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, step]);

  // Get OTP expiry on component mount and when step changes
  useEffect(() => {
    if (step === 'verify' && email) {
      refreshExpiryInfo();
      const interval = setInterval(refreshExpiryInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [step, email]);

  const refreshExpiryInfo = async () => {
    try {
      const data = await API.getOTPExpiry(email);
      setTimeLeft(data.remainingSeconds || 0);
      setAttemptsLeft(data.attemptsRemaining || 3);
    } catch (err) {
      // Silently fail - timer will show 0
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await API.requestOTP(email);
      setSuccess('OTP sent! Check your email.');
      setTimeout(() => {
        setStep('verify');
        setTimeLeft(300); // 5 minutes
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      setLoading(false);
    }
  };

  // Auto-send OTP if email is pre-filled from signup data
  useEffect(() => {
    if (signupData && email && step === 'email') {
      // Auto-send OTP after a short delay
      const timer = setTimeout(() => {
        API.requestOTP(email)
          .then(() => {
            setSuccess('OTP sent to ' + email);
            setTimeout(() => {
              setStep('verify');
              setTimeLeft(300);
            }, 1500);
          })
          .catch((err) => {
            setError(err.message || 'Failed to send OTP');
          });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [signupData, email, step]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await API.verifyOTP(email, code);
      
      // If there's signup data, create account with that data
      if (signupData) {
        try {
          const signupResponse = await API.signup(
            signupData.username,
            email, // Use email as display name
            signupData.password
          );
          setSuccess('✓ Account created! Logging you in...');
          sessionStorage.removeItem('pendingSignup');
          setTimeout(() => {
            onSuccess(signupResponse.session_token, signupResponse.user);
          }, 1500);
        } catch (signupErr: any) {
          // Account might already exist from OTP, continue with OTP user
          setSuccess('✓ Verified! Logging you in...');
          setTimeout(() => {
            onSuccess(response.token, response.user);
          }, 1500);
          sessionStorage.removeItem('pendingSignup');
        }
      } else {
        setSuccess('✓ Verified! Logging you in...');
        setTimeout(() => {
          onSuccess(response.token, response.user);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setCode('');
      setLoading(false);
      await refreshExpiryInfo();
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.resendOTP(email);
      setSuccess('New OTP sent!');
      setCode('');
      setTimeLeft(300);
      setAttemptsLeft(3);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCodeInput = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F13] via-[#1a1a22] to-[#0F0F13] text-white flex flex-col items-center justify-center p-4">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-300 to-amber-400 bg-clip-text text-transparent mb-3">
            {step === 'email' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 'email' 
              ? 'Enter your email to get started'
              : 'Enter the 6-digit code sent to your email'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={step === 'email' ? handleRequestOTP : handleVerifyOTP}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
        >
          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex gap-3"
            >
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 flex gap-3"
            >
              <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm">{success}</p>
            </motion.div>
          )}

          {step === 'email' ? (
            // Email Step
            <>
              {signupData && (
                <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm text-center">
                  Confirming your email: <span className="font-semibold">{email}</span>
                </div>
              )}
              
              <div className="relative mb-6">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  placeholder="your@gmail.com"
                  value={email}
                  onChange={(e) => !signupData && setEmail(e.target.value)}
                  disabled={!!signupData}
                  className={`w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all ${signupData ? 'opacity-75 cursor-not-allowed' : ''}`}
                />
              </div>

              {!signupData && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-gray-900 font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Code'}
                </button>
              )}
              
              {signupData && (
                <div className="text-center">
                  {success ? (
                    <p className="text-emerald-400 text-sm">{success}</p>
                  ) : (
                    <p className="text-gray-400 text-sm">Sending OTP...</p>
                  )}
                </div>
              )}
            </>
          ) : (
            // Verify Step
            <>
              <div className="mb-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs text-center">
                Code sent to {email}
              </div>

              <div className="relative mb-6 mt-6">
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(formatCodeInput(e.target.value))}
                  maxLength={6}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-4 text-2xl font-bold text-center tracking-widest placeholder-gray-600 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>

              {/* Timer */}
              <div className="flex justify-between items-center mb-6 text-sm text-gray-400">
                <span>Time remaining: <span className={timeLeft < 60 ? 'text-red-400 font-bold' : 'font-mono'}>{formatTime(timeLeft)}</span></span>
                <span>{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-gray-900 font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="w-full text-orange-400 hover:text-orange-300 font-medium py-2 transition-colors"
              >
                Resend Code
              </button>
            </>
          )}

          <p className="text-xs text-gray-500 text-center mt-6">
            We'll send a code to your email. Standard rates apply.
          </p>
        </motion.form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By signing up, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
