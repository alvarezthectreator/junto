import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { requestOTP, verifyOTP, resendOTP, getOTPExpiry } from '../services/api';

interface OTPLoginProps {
  onSuccess?: (token: string, user: any) => void;
  onNavigate?: (page: string) => void;
}

export function OTPLogin({ onSuccess, onNavigate }: OTPLoginProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendDisabled, setResendDisabled] = useState(false);

  // Timer for OTP expiry
  useEffect(() => {
    if (step !== 'otp' || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Get OTP expiry info
  useEffect(() => {
    if (step === 'otp' && email) {
      getOTPExpiry(email)
        .then((data) => {
          setTimeLeft(data.remainingSeconds || 300);
          setAttemptsLeft(data.attemptsRemaining || 3);
        })
        .catch((err) => console.error('Error getting OTP expiry:', err));
    }
  }, [step, email]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await requestOTP(email);
      if (result.success) {
        setSuccess('OTP sent! Check your email (check spam folder too)');
        setTimeLeft(300);
        setAttemptsLeft(3);
        setTimeout(() => {
          setStep('otp');
          setSuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6 || isNaN(Number(otp))) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(email, otp);
      if (result.success) {
        setSuccess('✅ Login successful!');
        localStorage.setItem('sessionToken', result.token);
        localStorage.setItem('junto-session-token', result.token);
        
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(result.token, result.user);
          } else {
            window.location.href = '/';
          }
        }, 1000);
      }
    } catch (err: any) {
      setAttemptsLeft(Math.max(0, (err.attemptsRemaining || 0)));
      setError(err.error || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendDisabled(true);
    try {
      const result = await resendOTP(email);
      if (result.success) {
        setSuccess('New OTP sent to your email!');
        setTimeLeft(300);
        setOtp('');
        setAttemptsLeft(3);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.error || 'Failed to resend OTP');
    } finally {
      setResendDisabled(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Junto</h1>
          <p className="text-gray-400">Sign in with your email to get started</p>
        </div>

        {/* Email Step */}
        {step === 'email' && (
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleRequestOTP}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-200">{success}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-gray-400 mt-6">
              New to Junto?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 font-medium">
                Create account
              </a>
            </p>
          </motion.form>
        )}

        {/* OTP Verification Step */}
        {step === 'otp' && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleVerifyOTP}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter 6-Digit Code
              </label>
              <p className="text-xs text-gray-500 mb-3">
                We sent a code to <strong>{email}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-center text-3xl font-bold tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-200">
                  <p>{error}</p>
                  {attemptsLeft > 0 && (
                    <p className="text-xs mt-1">Attempts remaining: {attemptsLeft}</p>
                  )}
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-200">{success}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Timer and Resend */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
              <span>
                ⏱️ Code expires in:{' '}
                <span className={timeLeft < 60 ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                  {formatTime(timeLeft)}
                </span>
              </span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendDisabled || loading}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed font-medium"
              >
                {resendDisabled ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError('');
                setSuccess('');
              }}
              className="w-full py-2 text-gray-400 hover:text-gray-300 font-medium text-sm transition-colors"
            >
              ← Change Email
            </button>
          </motion.form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="#" className="text-gray-400 hover:text-gray-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-gray-400 hover:text-gray-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
