export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      screens: {
        'xs': '360px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'sidebar-width': '16rem',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '48px'],
        '6xl': ['60px', '60px'],
      },
      maxWidth: {
        'mobile': '100%',
        'tablet': '768px',
        'desktop': '1400px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        lift: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
          '100%': { transform: 'translateY(-8px)', boxShadow: '0 20px 25px rgba(245, 158, 11, 0.2)' },
        },
        ripple: {
          '0%': { opacity: '1', transform: 'scale(0)' },
          '100%': { opacity: '0', transform: 'scale(4)' },
        },
        expandAccordion: {
          '0%': { opacity: '0', maxHeight: '0px', overflow: 'hidden' },
          '100%': { opacity: '1', maxHeight: '1000px' },
        },
        collapseAccordion: {
          '0%': { opacity: '1', maxHeight: '1000px' },
          '100%': { opacity: '0', maxHeight: '0px', overflow: 'hidden' },
        },
        slideOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(400px)' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out',
        fadeInUp: 'fadeInUp 0.6s ease-out',
        fadeInDown: 'fadeInDown 0.6s ease-out',
        slideUp: 'slideUp 0.6s ease-out',
        slideIn: 'slideIn 0.5s ease-out',
        slideInRight: 'slideInRight 0.5s ease-out',
        scaleIn: 'scaleIn 0.4s ease-out',
        pulseGlow: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmerEffect: 'shimmer 2s infinite',
        bounceGently: 'bounce 2s infinite',
        spinLoader: 'spin 1s linear infinite',
        lift: 'lift 0.3s ease-out',
        rippleClick: 'ripple 0.6s ease-out',
        expandAccordion: 'expandAccordion 0.3s ease-out',
        collapseAccordion: 'collapseAccordion 0.3s ease-out',
        slideOut: 'slideOut 0.4s ease-in',
        progressFill: 'progressFill 1.5s ease-out forwards',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
      },
    }
  }
}