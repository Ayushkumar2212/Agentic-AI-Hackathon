/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#090D16',
          deep: '#05070D',
          panel: '#0F1524',
          line: '#1B2437',
        },
        neon: {
          cyan: '#00F0FF',
          emerald: '#10B981',
          amber: '#F59E0B',
          crimson: '#EF4444',
          violet: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      opacity: {
        3: '0.03',
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        9: '0.09',
        12: '0.12',
        15: '0.15',
        18: '0.18',
        22: '0.22',
        28: '0.28',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0,240,255,0.35), 0 0 24px -4px rgba(0,240,255,0.45)',
        'glow-soft': '0 0 32px -8px rgba(0,240,255,0.35)',
        card: '0 18px 40px -24px rgba(0,0,0,0.9)',
      },
      keyframes: {
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translate(-50%, 6px) scale(0.9)' },
          '18%': { opacity: '1', transform: 'translate(-50%, -6px) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -34px) scale(0.98)' },
        },
        'pulse-ring': {
          '0%': { opacity: '0.55', transform: 'scale(0.85)' },
          '100%': { opacity: '0', transform: 'scale(1.7)' },
        },
        'rise': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scan': {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        'drift': {
          '0%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
      },
      animation: {
        sweep: 'sweep 2.6s ease-in-out infinite',
        'float-up': 'float-up 1.5s ease-out forwards',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
        rise: 'rise 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        scan: 'scan 3.5s linear infinite',
        drift: 'drift 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
