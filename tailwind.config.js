import { fontFamily } from "tailwindcss/defaultTheme";

export const content = [
  "./src/**/*.{js,ts,jsx,tsx}",
];

export const theme = {
  extend: {
    colors: {
      primary: {
        500: "#0d9488",  // teal-600 - main primary
        600: "#0f766e",  // teal-700 - darker for hover
        foreground: "#ffffff",
      },
      accent: {
        500: "#14b8a6",  // teal-500 - lighter accent
        600: "#0d9488",  // teal-600 - darker accent
        foreground: "#ffffff",
      },
      brand: {
        100: "#ccfbf1",  // teal-100 - very light
        200: "#99f6e4",  // teal-200 - light
        300: "#5eead4",  // teal-300 - medium light
        400: "#2dd4bf",  // teal-400 - medium
        500: "#14b8a6",  // teal-500 - main brand
      },
      background: "var(--color-background)",
      foreground: "var(--color-foreground)",
      border: "var(--color-border)",
    },
    fontFamily: {
      'poppins': ['var(--font-poppins)'],
      'montserrat': ['var(--font-montserrat)'],
      'sans-hebrew': ['var(--font-sans-hebrew)'],
      // Override default sans to use Poppins
      'sans': ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      mono: ["var(--font-mono)", ...fontFamily.mono],
    },
  },
};

export const plugins = [];