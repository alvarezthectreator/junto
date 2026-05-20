import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  isLoading?: boolean;
}

export function AnimatedButton({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className = '',
  ...props
}: AnimatedButtonProps) {
  const baseStyles =
    'font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 btn-transition btn-ripple';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-[#F59E0B] to-[#FB923C] text-white hover:shadow-lg shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    outline:
      'border-2 border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10',
    ghost: 'text-white hover:bg-white/5'
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 sm:py-3 text-sm sm:text-base',
    lg: 'px-8 py-3 sm:py-4 text-base sm:text-lg'
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      disabled={isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </motion.div>
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
