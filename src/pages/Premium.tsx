import React from 'react';
import { motion } from 'framer-motion';

interface PremiumProps {
}

export const Premium: React.FC<PremiumProps> = () => {
  return (
    <div className="flex min-h-screen bg-[#0F0F13] text-white">
      <main className="mobile-page-main ml-0 flex-1 overflow-x-hidden">
        {/* Blurry background */}
        <div className="absolute inset-0 blur-md opacity-30 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(251,146,60,0.12),transparent_24%),#0F0F13]" />

        {/* Coming Soon Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 flex min-h-screen items-center justify-center"
        >
          <div className="text-center px-6 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6"
            >
              <div className="text-6xl mb-4">🚀</div>
              <h1 className="text-5xl font-serif font-bold text-yellow-400 mb-3">
                Coming Soon
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-300 text-lg mb-8 leading-relaxed"
            >
              Premium subscriptions and billing features are under development. Stay tuned for exciting new ways to customize your Junto experience!
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-sm font-medium text-yellow-400"
            >
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              Features coming Q3 2026
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Premium;
