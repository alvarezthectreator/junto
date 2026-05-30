import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface VerificationModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSubmit?: (data: VerificationData) => void;
  isLoading?: boolean;
}

export interface VerificationData {
  userId: string;
  fullName: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  selfieImage: File | null;
  idImage: File | null;
  dateOfBirth: string;
}

export function VerificationModal({
  userId,
  userName,
  onClose,
  onSubmit,
  isLoading = false,
}: VerificationModalProps) {
  const [step, setStep] = useState<'info' | 'documents' | 'review'>('info');
  const [data, setData] = useState<VerificationData>({
    userId,
    fullName: userName,
    idType: 'national_id',
    idNumber: '',
    selfieImage: null,
    idImage: null,
    dateOfBirth: '',
  });

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData({ ...data, selfieImage: file });
    }
  };

  const handleIDCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData({ ...data, idImage: file });
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl bg-gradient-to-b from-[#1A1A21] to-[#111115] border border-white/10 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Get Verified</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-6">
          {['info', 'documents', 'review'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                ['info', 'documents', 'review'].indexOf(step) >= i
                  ? 'bg-emerald-500'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Step: Personal Info */}
        {step === 'info' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Type
              </label>
              <select
                value={data.idType}
                onChange={(e) => setData({ ...data, idType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Number
              </label>
              <input
                type="text"
                value={data.idNumber}
                onChange={(e) => setData({ ...data, idNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Enter your ID number"
              />
            </div>

            <button
              onClick={() => setStep('documents')}
              disabled={!data.fullName || !data.dateOfBirth || !data.idNumber}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step: Documents */}
        {step === 'documents' && (
          <div className="space-y-4">
            {/* Selfie */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Selfie Photo
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieCapture}
                  className="hidden"
                  id="selfie-upload"
                />
                <label
                  htmlFor="selfie-upload"
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    data.selfieImage
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {data.selfieImage ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-sm text-emerald-300">Selfie uploaded</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Take a selfie</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* ID Document */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ID Document
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIDCapture}
                  className="hidden"
                  id="id-upload"
                />
                <label
                  htmlFor="id-upload"
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    data.idImage
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {data.idImage ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-sm text-emerald-300">ID uploaded</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">Upload clear photo</p>
                    </>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Make sure both sides are clearly visible
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('info')}
                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!data.selfieImage || !data.idImage}
                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* Step: Review & Submit */}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Verification Process</p>
                  <p>
                    Your information will be reviewed by our team within 24-48 hours.
                    Once approved, you'll receive a verified badge on your profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white font-medium">{data.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ID Type:</span>
                <span className="text-white font-medium capitalize">
                  {data.idType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Documents:</span>
                <span className="text-emerald-400">✓ Both uploaded</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('documents')}
                className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
