import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import * as API from '../services/api';

export function ForgotPassword({ onBack, onSuccess }: { onBack: () => void; onSuccess: (token: string, user: any) => void; }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await API.requestOTP(email);
      setSuccess('OTP sent to your email. Check your inbox and spam folder.');
      setStep('verify');
    } catch (err: any) {
      setError(err.message || err.error || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (code.length !== 6 || isNaN(Number(code))) {
      setError('Please enter the 6-digit code from your email');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await API.resetPassword(email, code, newPassword);
      if (response.success && response.session_token && response.user) {
        setSuccess('Password reset successful. Logging you in...');
        setTimeout(() => {
          onSuccess(response.session_token, response.user);
        }, 800);
      } else {
        setSuccess(response.message || 'Password reset complete. Please sign in.');
      }
    } catch (err: any) {
      setError(err.message || err.error || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F13] via-[#1a1a22] to-[#0F0F13] text-white flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
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
            Reset Password
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 'request'
              ? 'Enter your email and we will send a verification code.'
              : 'Enter the code and choose a new password.'}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={step === 'request' ? handleRequestReset : handleResetPassword}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
        >
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                disabled={loading || step === 'verify'}
              />
            </div>

            {step === 'verify' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-semibold py-3 transition-all hover:from-orange-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Working...' : step === 'request' ? 'Send Code' : 'Reset Password'}
          </button>

          {step === 'verify' && (
            <button
              type="button"
              onClick={() => setStep('request')}
              disabled={loading}
              className="mt-4 w-full rounded-2xl border border-white/10 text-white py-3 bg-white/5 hover:bg-white/10 transition-all"
            >
              Enter a different email
            </button>
          )}
        </motion.form>
      </div>
    </div>
  );
}
