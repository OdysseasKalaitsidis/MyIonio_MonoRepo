/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backdropBlur: {
        xs: "2px",
      },
      colors: {
        glass: "rgba(255,255,255,0.04)",
        "glass-blue": "rgba(30, 41, 59, 0.7)",
        "deep-navy": "#0F172A",
        "ionian-blue": "#3B82F6",
        "blue-40": "#F0F7FF", // Slightly lighter than blue-50
        background: "#0A0A0F",
        surface: "#14141C",
        primary: "#4C8BF5",
        "primary-hover": "#3A7BE0",
        accent: "#8A5CF6",
        text: {
          DEFAULT: "#E9ECF2",
          muted: "#A3A7B1",
        },
        border: "#22222E",
        success: "#30D890",
        error: "#E4546A",
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 18px rgba(0, 0, 0, 0.35)",
      },
      borderRadius: {
        xl: "1.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
};
