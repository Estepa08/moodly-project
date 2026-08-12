/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          strong: 'hsl(var(--primary-strong))',
          muted: 'hsl(var(--primary-muted))',
          dim: 'hsl(var(--primary-dim))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          strong: 'hsl(var(--accent-strong))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          strong: 'hsl(var(--destructive-strong))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        pet: {
          1: 'hsl(var(--pet-1))',
          2: 'hsl(var(--pet-2))',
          3: 'hsl(var(--pet-3))',
          4: 'hsl(var(--pet-4))',
          5: 'hsl(var(--pet-5))',
          6: 'hsl(var(--pet-6))',
          7: 'hsl(var(--pet-7))',
          8: 'hsl(var(--pet-8))',
          9: 'hsl(var(--pet-9))',
          10: 'hsl(var(--pet-10))',
          11: 'hsl(var(--pet-11))',
          12: 'hsl(var(--pet-12))',
          13: 'hsl(var(--pet-13))',
          14: 'hsl(var(--pet-14))',
          15: 'hsl(var(--pet-15))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ["'DM Sans'", 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))',
        'btn-gradient': 'linear-gradient(120deg, hsl(264 95% 60%), hsl(262 85% 55%))',
        'btn-gradient-hot': 'linear-gradient(120deg, hsl(328 100% 74%), hsl(330 82% 54%))',
        aurora:
          'radial-gradient(120% 120% at 15% 0%, hsl(255 90% 70% / 0.20), transparent 45%), radial-gradient(120% 120% at 100% 100%, hsl(330 80% 70% / 0.18), transparent 45%), radial-gradient(80% 80% at 80% 0%, hsl(160 80% 60% / 0.14), transparent 50%)',
      },
      boxShadow: {
        'neumorphic-sm': 'var(--elevation-1)',
        neumorphic: 'var(--elevation-2)',
        'neumorphic-lg': 'var(--elevation-3)',
        'neumorphic-xl': 'var(--elevation-4)',
        'neumorphic-inset': 'var(--elevation-inset)',
        'elevation-1': 'var(--elevation-1)',
        'elevation-2': 'var(--elevation-2)',
        'elevation-3': 'var(--elevation-3)',
        'elevation-4': 'var(--elevation-4)',
        'elevation-inset': 'var(--elevation-inset)',
        clay: 'var(--clay-shadow)',
        'clay-lg': 'var(--clay-shadow-lg)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
