/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-green': '#00ff9f',
        'cyber-cyan': '#00d4ff',
        'cyber-purple': '#b967ff',
        'dark-bg': '#0a0a0f',
        'dark-card': '#12121a',
        'dark-border': '#1e1e2e',
        'dark-hover': '#1a1a25',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

