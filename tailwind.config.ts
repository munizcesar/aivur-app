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
        // ── Paleta Institucional Elite ──
        "elite-navy":    "#0A2E45", // Fundo primário Dark Navy
        "elite-red":     "#C41230", // Ação / CTA Bright Red
        "elite-wine":    "#6B0000", // Ênfase / Hover Dark Wine
        "elite-cream":   "#FBEBD0", // Fundo claro / texto principal
        "elite-grayblue":"#6B99B3", // Neutro / Apoio Grayish Blue
      },
    },
  },
  plugins: [],
};
export default config;
