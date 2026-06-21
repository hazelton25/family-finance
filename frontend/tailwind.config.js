export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hanken Grotesk', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Georgia', 'sans-serif'],
        mono: ['Spline Sans Mono', 'monospace'],
      },
      colors: {
        paper:     '#F7F6F1',
        card:      '#FFFFFF',
        ink:       '#1A1D18',
        stone:     '#8A8F86',
        line:      '#E3E1D8',
        fir:       '#2A5C46',
        'fir-soft':'#E3EDE6',
        coral:     '#E4572E',
        'coral-soft':'#FBE9E2',
        gold:      '#C9A227',
      },
      borderRadius: {
        DEFAULT: '14px',
      },
      animation: {
        'rise':     'rise 0.3s cubic-bezier(0.2,0.9,0.3,1)',
        'fade':     'fade 0.18s ease-out',
        'sheet-up': 'sheetUp 0.28s cubic-bezier(0.2,0.9,0.3,1)',
      },
      keyframes: {
        rise:   { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        fade:   { from: { opacity: 0 }, to: { opacity: 1 } },
        sheetUp:{ from: { opacity: 0, transform: 'translateY(22px)' }, to: { opacity: 1, transform: 'none' } },
      },
    },
  },
  plugins: [],
};
