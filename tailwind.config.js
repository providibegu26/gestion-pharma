/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── Turquoise (couleur signature, accents UI) ──────────────────────
        teal: {
          50:  '#ecfdf9',
          100: '#d0faf0',
          200: '#a3f1e0',
          300: '#6de2cc',
          400: '#34ccb3',
          500: '#15b298',
          600: '#0a8f7d',
          700: '#0a7265',
          800: '#0c5b51',
          900: '#0d4b44',
          950: '#022b27',
        },
        // ─── Cyan (variations) ────────────────────────────────────────────
        cyan: {
          50:  '#edfdff',
          100: '#d2f8fe',
          200: '#a8f1fd',
          300: '#69e3f9',
          400: '#21cce8',
          500: '#06aece',
          600: '#0a8baa',
          700: '#106e8a',
          800: '#175a72',
          900: '#194a61',
          950: '#0a3043',
        },
        // ─── Sable / beige (surfaces chaudes) ──────────────────────────────
        sand: {
          50:  '#fdfaf5',
          100: '#f9f2e6',
          200: '#f1e5ce',
          300: '#e6d3ad',
          400: '#d6b87f',
          500: '#c39c5b',
          600: '#a87f49',
          700: '#86653b',
          800: '#6a5031',
          900: '#544029',
        },
        // ─── Glass premium clair ──────────────────────────────────────────
        glass: {
          white: 'rgba(255,255,255,0.65)',
          border: 'rgba(15,23,42,0.06)',
          hover:  'rgba(255,255,255,0.85)',
        },
        // ─── Background app (légèrement nuancé) ────────────────────────────
        bg: {
          base:   '#f7f8fb',
          warm:   '#f8f5f0',
          card:   '#ffffff',
          muted:  '#eef1f6',
        },
      },
      fontFamily: {
        // 4 familles distinctes pour une vraie hiérarchie typographique
        display: ['"Sora"', 'ui-sans-serif', 'system-ui', 'sans-serif'],         // titres premium
        body:    ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],        // UI / corps
        medical: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],      // contenus / labels
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],              // données / chiffres
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        'tightest': '-0.025em',
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      backgroundImage: {
        // Surfaces premium claires
        'glass-light':   'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)',
        'panel':         'linear-gradient(180deg, #ffffff 0%, #fafbfd 100%)',
        'sand-soft':     'linear-gradient(135deg, #fdfaf5 0%, #f5efe2 100%)',
        // Halos ambiants subtils
        'aura-teal':     'radial-gradient(60% 50% at 20% 0%, rgba(21,178,152,0.10) 0%, transparent 70%)',
        'aura-sand':     'radial-gradient(50% 60% at 100% 100%, rgba(214,184,127,0.12) 0%, transparent 70%)',
        'hero-mesh':     'radial-gradient(at 15% 20%, rgba(21,178,152,0.12) 0%, transparent 55%), radial-gradient(at 85% 80%, rgba(6,174,206,0.08) 0%, transparent 50%), radial-gradient(at 60% 50%, rgba(214,184,127,0.07) 0%, transparent 55%)',
      },
      boxShadow: {
        // Ombres douces, premium, jamais agressives
        'soft':      '0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.03)',
        'card':      '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
        'card-hover':'0 4px 8px rgba(15,23,42,0.06), 0 12px 24px rgba(15,23,42,0.06)',
        'panel':     '0 0 0 1px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
        'glass':     '0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 32px rgba(15,23,42,0.06)',
        'glass-lg':  '0 1px 0 rgba(255,255,255,0.8) inset, 0 20px 60px rgba(15,23,42,0.10)',
        'teal':      '0 8px 24px rgba(21,178,152,0.18)',
        'teal-sm':   '0 4px 12px rgba(21,178,152,0.14)',
        'inset-soft':'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(15,23,42,0.03)',
      },
      animation: {
        'fade-up':     'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':     'fadeIn 0.4s ease-out forwards',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'pulse-teal':  'pulseTeal 2.5s ease-in-out infinite',
        'float':       'float 6s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeUp:      { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:      { from: { opacity: '0' }, to: { opacity: '1' } },
        slideRight:  { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseTeal:   { '0%,100%': { boxShadow: '0 0 0 0 rgba(21,178,152,0)' }, '50%': { boxShadow: '0 0 0 8px rgba(21,178,152,0.12)' } },
        float:       { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-6px)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
