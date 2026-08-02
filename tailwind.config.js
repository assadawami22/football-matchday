/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        pitch: '#123524',
        pitchLine: '#1F5C3F',
        pitchDeep: '#0B241A',
        chalk: '#F5F1E6',
        chalkDim: '#DCD6C4',
        amber: '#C98A2C',
        rust: '#B23A2E',
        ink: '#0E2019',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};
