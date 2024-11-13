/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4F3D83',
        secondary: '#234B9B',
        background: '#0D1117'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ]
}
