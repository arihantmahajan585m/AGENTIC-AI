import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1612",
        mute: "#6a5e52",
        paper: "#f6f1e8",
        panel: "#ffffff",
        panel2: "#efe7da",
        brass: "#8d5e12",
        coral: "#c2412d",
        sage: "#1c7a4a",
        mist: "#2d5f99",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
