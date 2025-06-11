import { fontFamily } from "tailwindcss/defaultTheme";

export const content = [
  "./src/**/*.{js,ts,jsx,tsx}",
];

export const theme = {
  extend: {
    colors: {
      primary: {
        500: "#36590B",  // your main primary color
        600: "#2B4708",  // slightly darker for hover
        foreground: "#FFF675",
      },
      accent: {
        500: "#91C312",
        600: "#75A109",
        foreground: "#36590B",
      },
      brand: {
        100: "#FFF675",
        200: "#F8D64D",
        300: "#7DBE34",
        400: "#60A425",
        500: "#496D15",
      },
      background: "var(--color-background)",
      foreground: "var(--color-foreground)",
      border: "var(--color-border)",
      ring: "var(--color-ring)",
    },
    fontFamily: {
      sans: ["var(--font-sans)", ...fontFamily.sans],
      mono: ["var(--font-mono)", ...fontFamily.mono],
    },
  },
};

export const plugins = [];