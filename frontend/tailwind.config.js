/** @type {import('tailwindcss').Config} */
const neumorphicSm = "3px 3px 6px rgba(160, 140, 180, 0.3), -3px -3px 6px rgba(255, 255, 255, 0.9)";
const neumorphic = "6px 6px 12px rgba(160, 140, 180, 0.35), -6px -6px 12px rgba(255, 255, 255, 0.9)";
const neumorphicLg = "8px 8px 20px rgba(160, 140, 180, 0.4), -8px -8px 20px rgba(255, 255, 255, 0.9)";
const neumorphicXl = "12px 12px 28px rgba(160, 140, 180, 0.45), -12px -12px 28px rgba(255, 255, 255, 0.85)";
const neumorphicInset = "inset 2px 2px 5px rgba(160, 140, 180, 0.3), inset -2px -2px 5px rgba(255, 255, 255, 0.8)";

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
        "neumorphic-sm": neumorphicSm,
        "neumorphic": neumorphic,
        "neumorphic-lg": neumorphicLg,
        "neumorphic-xl": neumorphicXl,
        "neumorphic-inset": neumorphicInset,
        "elevation-1": neumorphicSm,
        "elevation-2": neumorphic,
        "elevation-3": neumorphicLg,
        "elevation-4": neumorphicXl,
        "elevation-inset": neumorphicInset,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
