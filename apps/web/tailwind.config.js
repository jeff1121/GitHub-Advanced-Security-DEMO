/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bingo: {
          b: '#3b82f6',
          i: '#10b981',
          n: '#f59e0b',
          g: '#ec4899',
          o: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
};
