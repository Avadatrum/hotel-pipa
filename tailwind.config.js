/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Habilita dark mode via classe CSS
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}