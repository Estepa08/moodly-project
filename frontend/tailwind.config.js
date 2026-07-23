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
        neumorphic:
          "6px 6px 12px rgba(180, 160, 200, 0.3), -6px -6px 12px rgba(255, 255, 255, 0.8)",
        "neumorphic-sm":
          "3px 3px 6px rgba(180, 160, 200, 0.25), -3px -3px 6px rgba(255, 255, 255, 0.8)",
        "neumorphic-inset":
          "inset 3px 3px 6px rgba(180, 160, 200, 0.25), inset -3px -3px 6px rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
