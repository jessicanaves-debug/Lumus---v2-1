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
        branddi: {
          navy: "#0D3349",
          "navy-dark": "#081f2d",
          "navy-light": "#164460",
          teal: "#0E7C7B",
          "teal-light": "#14a8a6",
          green: "#10B981",
          "green-light": "#34D399",
          accent: "#F59E0B",
          text: "#E2EEF5",
          muted: "#7BA8C0",
          border: "#1E4A63",
          card: "#0F2D40",
          "card-hover": "#153650",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "branddi-gradient": "linear-gradient(135deg, #0D3349 0%, #0E4A62 50%, #0D3349 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
