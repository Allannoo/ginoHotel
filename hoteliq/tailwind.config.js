/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Цветовые токены берутся из CSS-переменных (см. index.css)
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
          soft: 'rgb(var(--accent-primary-soft) / <alpha-value>)',
        },
        gold: 'rgb(var(--accent-secondary) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        btn: '12px',
        card: '16px',
        modal: '20px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)',
        lift: '0 6px 20px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.12)',
        glow: '0 0 0 4px rgb(var(--accent-primary) / 0.15)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.4,0,0.2,1)',
        'page-enter': 'pageEnter 0.35s cubic-bezier(0.4,0,0.2,1)',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pageEnter: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
};
