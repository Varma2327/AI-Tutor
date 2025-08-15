import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Apple Color Emoji", "Segoe UI Emoji"],
      },
      colors: {
        brand: {
          50:  "#eef6ff",
          100: "#d9eaff",
          200: "#b7d6ff",
          300: "#8bbaff",
          400: "#5d98ff",
          500: "#3b82f6",
          600: "#2e6add",
          700: "#2453b3",
          800: "#1f458f",
          900: "#1c3a74",
        },
      },
      boxShadow: {
        soft: "0 6px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
