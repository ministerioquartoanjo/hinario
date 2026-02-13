/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./remote-control.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'orange-dark': '#ea580c',
      },
    },
  },
  plugins: [],
}
