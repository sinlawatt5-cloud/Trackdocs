/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(8, 15, 33, 0.45)',
        glass: '0 16px 48px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'trackdocs-radial':
          'radial-gradient(circle at top, rgba(56, 189, 248, 0.22), transparent 42%), radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.12), transparent 34%)',
      },
    },
  },
  plugins: [],
}
