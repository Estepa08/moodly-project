/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Raleway", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      backgroundImage: {
        "card-gradient": "linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary) / 0.3))",
      },
      boxShadow: {
        "neumorphic-sm": "var(--elevation-1)",
        neumorphic: "var(--elevation-2)",
        "neumorphic-lg": "var(--elevation-3)",
        "neumorphic-xl": "var(--elevation-4)",
        "neumorphic-inset": "var(--elevation-inset)",
        "elevation-1": "var(--elevation-1)",
        "elevation-2": "var(--elevation-2)",
        "elevation-3": "var(--elevation-3)",
        "elevation-4": "var(--elevation-4)",
        "elevation-inset": "var(--elevation-inset)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
