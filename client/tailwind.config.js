/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0E3B2C',
        moss: '#3F7D58',
        sage: '#A9C5A0',
        parchment: '#F6F1E3',
        ink: '#1B1B18',
        amber: '#B7791F',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
