/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#f7f5f0',
          100: '#ede9df',
          200: '#d9d1c0',
          300: '#c2b49a',
          400: '#ab9674',
          500: '#9a8260',
          600: '#846c52',
          700: '#6b5644',
          800: '#5a483b',
          900: '#4d3f35',
        },
        leaf: {
          50: '#f0f9f0',
          100: '#dbf0db',
          200: '#b9e1b9',
          300: '#8bcc8b',
          400: '#5bb35b',
          500: '#3d9b3d',
          600: '#2d7d2d',
          700: '#266326',
          800: '#224f22',
          900: '#1d421d',
        },
        soil: {
          50: '#faf6f1',
          100: '#f0e6d6',
          200: '#e0ccad',
          300: '#cdac7d',
          400: '#be9259',
          500: '#b07d42',
          600: '#9a6537',
          700: '#7e4e30',
          800: '#68402c',
          900: '#573627',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
