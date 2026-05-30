import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dermiq: {
          bg: "#0A0A0A",
          surface: "#1C1C1E",
          surface2: "#2C2C2E",
          text: "#FFFFFF",
          muted: "#888888",
          accent: "#D85A30",
          border: "#2C2C2E"
        }
      },
    },
  },
  plugins: [],
};
export default config;
