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
        background: "#09090B",
        foreground: "#F4F4F5",
        accent: "#6366F1",
        "accent-secondary": "#4F46E5",
        whatsapp: "#10B981",
        muted: "#71717A",
        border: "#27272A",
        "surface-mid": "#121214",
        "surface-float": "#1C1C1F",
        precision: "#27272A",
        "text-primary": "#F4F4F5",
        "text-muted": "#71717A",
      },
      fontFamily: {
        calistoga: ["var(--font-calistoga)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
