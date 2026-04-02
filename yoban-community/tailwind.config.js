/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        yoban: {
          green: '#2E7D32',
          light: '#66BB6A',
          bg: '#F1F8E9',
          orange: '#FF6F00',
        },
      },
    },
  },
  plugins: [],
}
