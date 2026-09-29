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
        "hero-bg":  "#03102A",
        "hero-red": "#3BA7F2",
        "hero-off": "#E8F6FF",
      },
    },
  },
  plugins: [],
};

export default config;
