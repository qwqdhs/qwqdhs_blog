/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
        xl: "3rem",
      },
    },
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F2EBDC",
          dark: "#E8DFC8",
          ink: "#1A1714",
        },
        ink: {
          DEFAULT: "#0B0B0F",
          900: "#0B0B0F",
          800: "#1A1714",
          700: "#2A2520",
          600: "#4A4239",
          500: "#6E6557",
          400: "#9A8F7D",
          300: "#C2B8A2",
          200: "#D9CFB7",
          100: "#F2EBDC",
        },
        accent: {
          red: "#FF3B1C",
          yellow: "#FFD400",
          blue: "#3B5BFF",
          green: "#1FAE5B",
          violet: "#7A2DFF",
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        widest: '0.3em',
      },
      animation: {
        'hue-cycle': 'hue-cycle 18s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.9s ease-out both',
        'ticker': 'ticker 30s linear infinite',
        'blink': 'blink 1.1s steps(2) infinite',
        'drift': 'drift 8s ease-in-out infinite alternate',
      },
      keyframes: {
        'hue-cycle': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'ticker': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'drift': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '100%': { transform: 'translate(20px, -10px) rotate(2deg)' },
        },
      },
    },
  },
  plugins: [],
};
