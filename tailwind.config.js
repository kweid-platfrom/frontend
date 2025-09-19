/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--color-border))',
        input: 'rgb(var(--color-input))',
        ring: 'rgb(var(--color-ring))',
        background: 'rgb(var(--color-background))',
        foreground: 'rgb(var(--color-foreground))',
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          foreground: 'rgb(var(--color-primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          foreground: 'rgb(var(--color-secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-destructive))',
          foreground: 'rgb(var(--color-destructive-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--color-muted))',
          foreground: 'rgb(var(--color-muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          foreground: 'rgb(var(--color-accent-foreground))',
        },
        popover: {
          DEFAULT: 'rgb(var(--color-popover))',
          foreground: 'rgb(var(--color-popover-foreground))',
        },
        card: {
          DEFAULT: 'rgb(var(--color-card))',
          foreground: 'rgb(var(--color-card-foreground))',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--color-sidebar))',
          foreground: 'rgb(var(--color-sidebar-foreground))',
        },
        nav: {
          DEFAULT: 'rgb(var(--color-nav))',
          foreground: 'rgb(var(--color-nav-foreground))',
        },
        content: {
          DEFAULT: 'rgb(var(--color-content))',
          foreground: 'rgb(var(--color-content-foreground))',
        },
        success: 'rgb(var(--color-success))',
        warning: 'rgb(var(--color-warning))',
        error: 'rgb(var(--color-error))',
        info: 'rgb(var(--color-info))',
        teal: {
          50: 'rgb(var(--color-teal-50, 240 253 250))',
          100: 'rgb(var(--color-teal-100, 204 251 241))',
          300: 'rgb(var(--color-teal-300, 94 234 212))',
          500: 'rgb(var(--color-teal-500, 20 184 166))',
          600: 'rgb(var(--color-teal-600, 13 148 136))',
          800: 'rgb(var(--color-teal-800, 15 118 110))',
        },
        gray: {
          50: 'rgb(var(--color-muted))',
          100: 'rgb(var(--color-muted))',
          200: 'rgb(var(--color-border))',
          300: 'rgb(var(--color-border))',
          400: 'rgb(var(--color-muted-foreground))',
          500: 'rgb(var(--color-muted-foreground))',
          600: 'rgb(var(--color-muted-foreground))',
          700: 'rgb(var(--color-foreground))',
          800: 'rgb(var(--color-foreground))',
          900: 'rgb(var(--color-foreground))',
          950: 'rgb(var(--color-background))',
        },
        white: 'rgb(var(--color-background))',
        black: 'rgb(var(--color-foreground))',
      },
       orange: {
          50:  "#FFF5EC",
          100: "#FFE5D0",
          200: "#FFC299",
          300: "#FFA066",
          400: "#FF8B30", // your default
          500: "#F5761F",
          600: "#DB660F",
          700: "#B14F0A",
          800: "#803906",
          900: "#4D2202",
       },
      boxShadow: {
        'theme-sm': 'var(--shadow-sm)',
        'theme': 'var(--shadow)',
        'theme-md': 'var(--shadow-md)',
        'theme-lg': 'var(--shadow-lg)',
        'theme-xl': 'var(--shadow-xl)',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        'sans-hebrew': ['var(--font-sans-hebrew)', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};