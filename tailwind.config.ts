import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#185FA5",
          light: "#E6F1FB",
          soft: "#B5D4F4",
        },
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        border: "var(--border)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        status: {
          wait: { bg: "#FAEEDA", fg: "#854F0B" },
          process: { bg: "#E6F1FB", fg: "#185FA5" },
          ready: { bg: "#EAF3DE", fg: "#3B6D11" },
          done: { bg: "#F1EFE8", fg: "#5F5E5A" },
        },
      },
      borderRadius: {
        xl: "12px",
        lg: "10px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
