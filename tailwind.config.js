/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        juleRød: '#c81d25',
        juleGrå: '#f5f5f5'
      }
    },
  },
  plugins: [],
}
