/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#E2E8F0',
        accent: '#38BDF8',
      },
      borderRadius: {
        'xl': '12px',
      },
    },
  },
  plugins: [],
}