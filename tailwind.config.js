/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'Share Tech Mono'", "monospace"],
      },
      colors: {
        space: {
          bg: "#050d1a",
          card: "#0a1628",
          border: "#1a3a5c",
          accent: "#00d4ff",
          glow: "#00a8cc",
          warn: "#ff6b35",
          success: "#39ff14",
          muted: "#4a7fa5",
        },
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        flicker: "flicker 3s linear infinite",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.85 },
        },
      },
    },
  },
  plugins: [],
};
