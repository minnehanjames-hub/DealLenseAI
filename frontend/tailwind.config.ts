import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#071016",
        panel: "#0d1820",
        panelSoft: "#12212b",
        line: "#223442",
        mint: "#6ee7b7",
        gold: "#f8d477",
        cyan: "#7dd3fc"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(125, 211, 252, 0.08), 0 18px 70px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

