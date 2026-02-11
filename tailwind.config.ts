import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "sky-50": "#f3f8ff",
        "pink-100": "#ffd6ee",
        "mint-100": "#ceffd7",
        "lavender-100": "#e1ddff",
        "sun-100": "#fff1b8"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(16, 16, 20, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
