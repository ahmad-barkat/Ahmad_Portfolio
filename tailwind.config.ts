import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
        display: ["Cartefield", "serif"],
        serif:   ["Georgia", "Times New Roman", "serif"],
      },
      colors: {
        "hero-bg":  "#0B0B0B",
        "hero-red": "#E50914",
        "hero-off": "#E5E5E5",
      },
    },
  },
  plugins: [],
};

export default config;
