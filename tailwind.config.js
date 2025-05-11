const { cssVar } = require("tailwindcss/helpers");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: cssVar('--background', '#181818'),
        foreground: cssVar('--foreground', '#fff'),
        card: cssVar('--card', '#232323'),
        'card-foreground': cssVar('--card-foreground', '#fff'),
        border: cssVar('--border', '#333'),
        input: cssVar('--input', '#232323'),
        ring: cssVar('--ring', '#ff5500'),
        primary: cssVar('--primary', '#ff5500'),
        'primary-foreground': cssVar('--primary-foreground', '#fff'),
        secondary: cssVar('--secondary', '#232323'),
        'secondary-foreground': cssVar('--secondary-foreground', '#fff'),
        muted: cssVar('--muted', '#232323'),
        'muted-foreground': cssVar('--muted-foreground', '#aaa'),
        accent: cssVar('--accent', '#ff5500'),
        'accent-foreground': cssVar('--accent-foreground', '#fff'),
        destructive: cssVar('--destructive', '#ff3333'),
        'destructive-foreground': cssVar('--destructive-foreground', '#fff'),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 