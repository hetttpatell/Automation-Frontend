import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFA",
        foreground: "#0F172A",
        accent: "#0052FF",
        "accent-secondary": "#4D7CFF",
        whatsapp: "#25D366",
        muted: "#F1F5F9",
        border: "#E2E8F0",
      },
      fontFamily: {
        calistoga: ["var(--font-calistoga)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
