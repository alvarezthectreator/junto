/**
 * Animation Variants & Configurations
 * Reusable Framer Motion animation patterns for consistent smooth animations
 */

// ============================================================
// FADE ANIMATIONS
// ============================================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

export const fadeOut = {
  animate: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeIn' }
};

// ============================================================
// SLIDE ANIMATIONS
// ============================================================

export const slideUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

export const slideDown = {
  initial: { opacity: 0, y: -40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

export const slideIn = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

// ============================================================
// SCALE ANIMATIONS
// ============================================================

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

export const scaleInBig = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } // Spring ease
};

// ============================================================
// HOVER ANIMATIONS
// ============================================================

export const hoverLift = {
  whileHover: { y: -8, transition: { duration: 0.3, ease: 'easeOut' } }
};

export const hoverScale = {
  whileHover: { scale: 1.05, transition: { duration: 0.3, ease: 'easeOut' } }
};

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// ============================================================
// STAGGER ANIMATIONS
// ============================================================

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4 }
};

// ============================================================
// TAP/CLICK ANIMATIONS
// ============================================================

export const tapScale = {
  whileTap: { scale: 0.95 }
};

export const tapPress = {
  whileTap: { scale: 0.98, y: 2 }
};

// ============================================================
// MODAL ANIMATIONS
// ============================================================

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
};

// ============================================================
// DROPDOWN ANIMATIONS
// ============================================================

export const dropdownMenu = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
  transition: { duration: 0.2, ease: 'easeOut' }
};

// ============================================================
// PAGE TRANSITION ANIMATIONS
// ============================================================

export const pageEnter = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

export const pageExit = {
  animate: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeIn' }
};

// ============================================================
// ACCORDION ANIMATIONS
// ============================================================

export const accordionItem = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

export const toastEnter = {
  initial: { opacity: 0, x: 400 },
  animate: { opacity: 1, x: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
};

export const toastExit = {
  animate: { opacity: 0, x: 400 },
  transition: { duration: 0.3, ease: 'easeIn' }
};

// ============================================================
// CARD LIST ANIMATIONS
// ============================================================

export const cardContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

export const cardItem = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

// ============================================================
// CUSTOM SCROLL ANIMATIONS
// ============================================================

export const scrollFadeIn = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '0px 0px -100px 0px' }
};

export const scrollSlideIn = {
  initial: { opacity: 0, x: -60 },
  whileInView: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '0px 0px -100px 0px' }
};

export const scrollScaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  whileInView: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true, margin: '0px 0px -100px 0px' }
};

// ============================================================
// LOADER & SPINNER ANIMATIONS
// ============================================================

export const spin = {
  animate: { rotate: 360 },
  transition: { duration: 1, repeat: Infinity, ease: 'linear' }
};

export const pulse = {
  animate: { opacity: [1, 0.5, 1] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
};

export const shimmer = {
  animate: { backgroundPosition: ['200% 0', '-200% 0'] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
};

// ============================================================
// PROGRESS BAR
// ============================================================

export const progressBar = {
  animate: { width: '100%' },
  transition: { duration: 1.5, ease: 'easeOut' }
};

// ============================================================
// IMAGE ANIMATIONS
// ============================================================

export const imageHover = {
  whileHover: { scale: 1.08 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get staggered animation with delay
 */
export const getStaggeredAnimation = (index: number, baseDelay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.4,
    delay: baseDelay + index * 0.1,
    ease: 'easeOut'
  }
});

/**
 * Get scroll into view animation
 */
export const getScrollAnimation = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
  viewport: { once: true, margin: '0px 0px -100px 0px' }
});
