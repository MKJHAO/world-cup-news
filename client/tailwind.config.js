/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a472a',
        gold: '#c4922e',
        'gold-light': '#f0c050',
        dark: '#0a0f16',
        card: '#111a26',
        'card-hover': '#152030',
        accent: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'live-pulse': 'livePulse 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'border-glow': 'borderGlow 2s ease-in-out infinite',
        'score-pop': 'scorePop 0.4s ease-out',
        'gradient-shift': 'gradientShift 3s ease infinite'
      },
      backgroundSize: {
        '300%': '300% 300%'
      }
    }
  },
  plugins: []
};
